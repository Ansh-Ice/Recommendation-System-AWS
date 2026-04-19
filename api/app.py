"""Flask application entry point for the movie recommendation API."""

import logging
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
        query = request.args.get("query", "").strip()
        if not query:
            return jsonify({"error": "Missing required query parameter: query"}), 400
        if len(query) < 2:
            return jsonify({"query": query, "results": []}), 200

        try:
            matches = metadata_store.search_movies(query)
            return jsonify({"query": query, "results": matches}), 200
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
                    recommendations.append(metadata)
                else:
                    recommendations.append(
                        {
                            "title": title,
                            "poster_url": "",
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
