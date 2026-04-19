"""Flask application entry point for the movie recommendation API."""

import logging
from functools import lru_cache

import requests
from flask_cors import CORS
from flask import Flask, jsonify, request

try:
    from .config import HOST, PORT, MOVIES_PATH, SIMILARITY_PATH
    from .services import (
        DynamoDBService,
        MovieNotFoundError,
        RecommendationError,
        RecommendationService,
    )
except ImportError:
    from config import HOST, PORT, MOVIES_PATH, SIMILARITY_PATH
    from services import (
        DynamoDBService,
        MovieNotFoundError,
        RecommendationError,
        RecommendationService,
    )


TMDB_API_KEY = "bed2a9ca9b73159fc720691c2485aa30"
TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"


@lru_cache(maxsize=256)
def get_poster(movie_title: str) -> str:
    """Fetch and cache a poster URL for the supplied movie title."""
    if not movie_title.strip():
        return ""

    try:
        response = requests.get(
            TMDB_SEARCH_URL,
            params={"api_key": TMDB_API_KEY, "query": movie_title},
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException:
        logging.getLogger(__name__).exception(
            "Unable to fetch poster from TMDB for '%s'.", movie_title
        )
        return ""

    results = data.get("results", [])
    if results:
        poster_path = results[0].get("poster_path")
        if poster_path:
            return f"{TMDB_POSTER_BASE_URL}/{poster_path.lstrip('/')}"

    return ""


def create_app() -> Flask:
    """Create and configure the Flask application."""
    # Configure application-wide logging for debugging and production visibility.
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    logger = logging.getLogger(__name__)

    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173"])

    # Load the model artifacts once during startup so every request can reuse them.
    recommender = RecommendationService(
        movies_path=MOVIES_PATH,
        similarity_path=SIMILARITY_PATH,
    )
    metadata_store = DynamoDBService()
    app.config["RECOMMENDER_SERVICE"] = recommender
    app.config["METADATA_STORE"] = metadata_store

    @app.get("/")
    def home():
        """Simple root endpoint to confirm the API is running."""
        return "Movie Recommendation API is running", 200

    @app.post("/add_movie")
    def add_movie():
        """Insert one or more movie records into DynamoDB."""
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        try:
            if isinstance(payload, list):
                inserted_count = metadata_store.add_movies(payload)
                return jsonify({"message": "Movies added successfully.", "count": inserted_count}), 201

            if "movies" in payload:
                movies = payload.get("movies")
                if not isinstance(movies, list) or not movies:
                    return jsonify({"error": "'movies' must be a non-empty list."}), 400

                inserted_count = metadata_store.add_movies(movies)
                return jsonify({"message": "Movies added successfully.", "count": inserted_count}), 201

            metadata_store.add_movie(payload)
            return jsonify({"message": "Movie added successfully.", "movie": payload}), 201
        except Exception:
            logger.exception("Unexpected error while adding movies to DynamoDB.")
            return jsonify({"error": "Unable to add movie data."}), 500

    @app.get("/search")
    def search_movies():
        """Return matching movie suggestions from DynamoDB."""
        query = request.args.get("query", "").strip().lower()
        if len(query) < 2:
            return jsonify({"results": []}), 200

        try:
            movies_table = metadata_store._get_movies_table()
            response = movies_table.scan()
            results = []

            while True:
                for item in response.get("Items", []):
                    title = str(item.get("title", "")).lower()

                    if query in title:
                        results.append(
                            {
                                "title": item.get("title"),
                                "movie_id": item.get("movie_id"),
                            }
                        )

                        if len(results) == 10:
                            return jsonify({"results": results}), 200

                if "LastEvaluatedKey" not in response:
                    break

                response = movies_table.scan(
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )

            return jsonify({"results": results[:10]}), 200
        except Exception:
            logger.exception("Unexpected error while searching movie metadata.")
            return jsonify({"error": "Unable to search movie data."}), 500

    @app.get("/recommend")
    def recommend_movies():
        """Return the top movie recommendations for a given title."""
        movie_name = request.args.get("movie", "").strip()

        # Guard against missing query parameters before touching the model.
        if not movie_name:
            return jsonify({"error": "Missing required query parameter: movie"}), 400

        try:
            recommended_titles = recommender.recommend(movie_name)
            try:
                metadata_by_title = metadata_store.get_movies_by_titles(
                    recommended_titles
                )
            except Exception:
                logger.exception(
                    "Unable to load recommendation metadata from DynamoDB."
                )
                metadata_by_title = {}
            recommendations = []

            for title in recommended_titles:
                metadata = metadata_by_title.get(title.strip().lower())
                if metadata:
                    poster_url = metadata.get("poster_url") or get_poster(title)
                    recommendations.append(metadata)
                    recommendations[-1]["poster"] = poster_url
                    recommendations[-1]["poster_url"] = poster_url
                else:
                    poster_url = get_poster(title)
                    recommendations.append(
                        {
                            "title": title,
                            "poster": poster_url,
                            "poster_url": poster_url,
                            "overview": "",
                            "genres": [],
                            "tags": "",
                        }
                    )

            return (
                jsonify(
                    {
                        "movie": movie_name,
                        "recommendations": recommendations,
                    }
                ),
                200,
            )
        except MovieNotFoundError as exc:
            return jsonify({"error": str(exc)}), 404
        except RecommendationError as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception("Unexpected error while generating recommendations.")
            return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    # Expose the Flask server on all interfaces for local or container deployment.
    app.run(host=HOST, port=PORT)
