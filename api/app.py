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
def get_movie_details(movie_title: str) -> dict:
    """Fetch and cache poster and overview data for the supplied movie title."""
    if not movie_title.strip():
        return {"poster": "", "overview": ""}

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
            "Unable to fetch movie details from TMDB for '%s'.", movie_title
        )
        return {"poster": "", "overview": ""}

    results = data.get("results", [])
    if results:
        movie = results[0]
        poster_path = movie.get("poster_path")
        overview = movie.get("overview") or ""
        if poster_path:
            return {
                "poster": f"{TMDB_POSTER_BASE_URL}/{poster_path.lstrip('/')}",
                "overview": overview,
            }
        return {"poster": "", "overview": overview}

    return {"poster": "", "overview": ""}


def create_app() -> Flask:
    """Create and configure the Flask application."""
    # Configure application-wide logging for debugging and production visibility.
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    logger = logging.getLogger(__name__)

    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

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

    @app.post("/signup")
    def signup():
        """Create a new user account in DynamoDB."""
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        user_id = str(payload.get("user_id", "")).strip()
        password = str(payload.get("password", ""))

        if not user_id or not password:
            return jsonify({"error": "Missing required fields"}), 400

        try:
            metadata_store.create_user(user_id, password)
            return jsonify({"message": "Signup successful", "user_id": user_id}), 201
        except ValueError as exc:
            if str(exc) == "User already exists.":
                return jsonify({"error": str(exc)}), 409
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception("Unexpected error while signing up a user.")
            return jsonify({"error": "Unable to create user."}), 500

    @app.post("/login")
    def login():
        """Validate a user login against DynamoDB."""
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        user_id = str(payload.get("user_id", "")).strip()
        password = str(payload.get("password", ""))

        if not user_id or not password:
            return jsonify({"error": "Invalid credentials"}), 401

        try:
            if metadata_store.validate_user(user_id, password):
                return jsonify({"message": "Login successful", "user_id": user_id}), 200
            return jsonify({"error": "Invalid credentials"}), 401
        except Exception:
            logger.exception("Unexpected error while logging in a user.")
            return jsonify({"error": "Unable to login."}), 500

    @app.post("/like")
    def like_movie():
        """Store a liked movie for a user in DynamoDB."""
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        user_id = str(payload.get("user_id", "")).strip()
        movie = payload.get("movie")

        if not user_id:
            return jsonify({"error": "Missing required field: user_id"}), 400
        if not isinstance(movie, dict) or not movie:
            return jsonify({"error": "Missing required field: movie"}), 400

        try:
            metadata_store.like_movie(user_id, movie)
            return jsonify({"message": "Movie liked successfully"}), 200
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception("Unexpected error while liking a movie.")
            return jsonify({"error": "Unable to store liked movie."}), 500

    @app.post("/unlike")
    def unlike_movie_endpoint():
        """Remove a liked movie for a user in DynamoDB."""
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Request body must be valid JSON."}), 400

        user_id = str(payload.get("user_id", "")).strip()
        movie_title = str(payload.get("movie_title", "")).strip()

        if not user_id or not movie_title:
            return jsonify({"error": "Missing required field: user_id or movie_title"}), 400

        try:
            metadata_store.unlike_movie(user_id, movie_title)
            return jsonify({"message": "Movie unliked successfully"}), 200
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception("Unexpected error while unliking a movie.")
            return jsonify({"error": "Unable to remove liked movie."}), 500

    @app.get("/user/<user_id>")
    def get_user_liked_movies(user_id: str):
        """Fetch liked movies for a user from DynamoDB."""
        normalized_user_id = user_id.strip()
        if not normalized_user_id:
            return jsonify({"liked_movies": []}), 200

        try:
            user = metadata_store.get_user(normalized_user_id)
            if not user:
                return jsonify({"liked_movies": []}), 200

            return jsonify({"liked_movies": user.get("liked_movies", [])}), 200
        except Exception:
            logger.exception("Unexpected error while fetching user liked movies.")
            return jsonify({"error": "Unable to fetch liked movies."}), 500

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
                                "overview": item.get("overview", ""),
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

    @app.get("/trending")
    def get_trending_movies():
        """Return the top 10 trending movies based on user likes."""
        try:
            users_table = metadata_store._get_users_table()
            movie_counts = {}
            
            # Scan users table with limit to control read costs
            response = users_table.scan(ProjectionExpression="liked_movies", Limit=100)
            
            while True:
                for item in response.get("Items", []):
                    liked_movies = item.get("liked_movies", [])
                    for movie in liked_movies:
                        movie_title = str(movie.get("title", "")).strip().lower()
                        if movie_title:
                            movie_counts[movie_title] = movie_counts.get(movie_title, 0) + 1
                
                if "LastEvaluatedKey" not in response:
                    break
                
                response = users_table.scan(
                    ProjectionExpression="liked_movies",
                    Limit=100,
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )
            
            # Sort by frequency and get top 10
            top_titles = sorted(movie_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            trending_movies = []
            
            # Fetch full movie details for top trending movies
            title_list = [title for title, _ in top_titles]
            metadata_by_title = metadata_store.get_movies_by_titles(title_list)
            
            for title, count in top_titles:
                metadata = metadata_by_title.get(title.strip().lower())
                if metadata:
                    details = get_movie_details(title.title())
                    trending_movies.append({
                        "title": metadata.get("title", title.title()),
                        "movie_id": metadata.get("movie_id", ""),
                        "overview": details["overview"] or metadata.get("overview", ""),
                        "poster": details["poster"],
                        "likes_count": count
                    })
            
            return jsonify({"trending": trending_movies}), 200
        except Exception:
            logger.exception("Unexpected error while fetching trending movies.")
            return jsonify({"error": "Unable to fetch trending movies."}), 500

    @app.get("/genre/<genre_name>")
    def get_movies_by_genre(genre_name: str):
        """Return top 15 movies that match the specified genre."""
        normalized_genre = genre_name.strip().lower()
        if not normalized_genre:
            return jsonify({"results": []}), 200
        
        try:
            movies_table = metadata_store._get_movies_table()
            matching_movies = []
            
            # Scan movies with limit to control read costs
            response = movies_table.scan(
                ProjectionExpression="movie_id, title, genres, tags, overview, poster_url",
                Limit=100
            )
            
            while len(matching_movies) < 15:
                for item in response.get("Items", []):
                    # Check both tags and genres for the genre name
                    tags = item.get("tags", [])
                    genres = item.get("genres", [])
                    
                    # Ensure tags and genres are lists
                    if isinstance(tags, str):
                        tags = [tags]
                    if isinstance(genres, str):
                        genres = [genres]
                    
                    combined = [str(t).lower() for t in tags] + [str(g).lower() for g in genres]
                    
                    if any(normalized_genre in str(tag) for tag in combined):
                        title = item.get("title", "")
                        details = get_movie_details(title)
                        matching_movies.append({
                            "title": title,
                            "movie_id": item.get("movie_id", ""),
                            "overview": details["overview"] or item.get("overview", ""),
                            "poster": details["poster"]
                        })
                        
                        if len(matching_movies) >= 15:
                            break
                
                if "LastEvaluatedKey" not in response or len(matching_movies) >= 15:
                    break
                
                response = movies_table.scan(
                    ProjectionExpression="movie_id, title, genres, tags, overview, poster_url",
                    Limit=100,
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )
            
            return jsonify({"results": matching_movies[:15]}), 200
        except Exception:
            logger.exception("Unexpected error while fetching genre movies.")
            return jsonify({"error": "Unable to fetch genre movies."}), 500
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

            searched_movie_metadata = metadata_store.get_movie_by_title(movie_name)
            searched_movie_details = get_movie_details(movie_name)
            searched_movie = {
                "title": movie_name,
                "movie_id": searched_movie_metadata.get("movie_id", "") if searched_movie_metadata else "",
                "poster": searched_movie_details["poster"],
                "overview": searched_movie_details["overview"]
                or (
                    searched_movie_metadata.get("overview", "")
                    if searched_movie_metadata
                    else ""
                ),
            }
            recommendations.append(searched_movie)

            for title in recommended_titles:
                if title.strip().lower() == movie_name.strip().lower():
                    continue

                metadata = metadata_by_title.get(title.strip().lower())
                details = get_movie_details(title)
                recommendations.append(
                    {
                        "title": title,
                        "movie_id": metadata.get("movie_id", "") if metadata else "",
                        "poster": details["poster"],
                        "overview": details["overview"]
                        or (metadata.get("overview", "") if metadata else ""),
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

    @app.get("/recommend/user/<user_id>")
    def recommend_movies_for_user(user_id: str):
        """Return recommendations based on the user's most recently liked movie."""
        normalized_user_id = user_id.strip()
        if not normalized_user_id:
            return jsonify({"error": "Missing required path parameter: user_id"}), 400

        try:
            user = metadata_store.get_user(normalized_user_id)
            liked_movies = user.get("liked_movies", []) if user else []
            if not liked_movies:
                return jsonify({"based_on": "", "recommendations": []}), 200

            last_liked_movie = liked_movies[-1]
            based_on = str(last_liked_movie.get("title", "")).strip()
            if not based_on:
                return jsonify({"based_on": "", "recommendations": []}), 200

            recommended_titles = recommender.recommend(based_on)
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
                details = get_movie_details(title)
                recommendations.append(
                    {
                        "title": title,
                        "movie_id": metadata.get("movie_id", "") if metadata else "",
                        "poster": details["poster"],
                        "overview": details["overview"]
                        or (metadata.get("overview", "") if metadata else ""),
                    }
                )

            return jsonify({"based_on": based_on, "recommendations": recommendations}), 200
        except MovieNotFoundError as exc:
            return jsonify({"error": str(exc)}), 404
        except RecommendationError as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception(
                "Unexpected error while generating user-based recommendations."
            )
            return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    # Expose the Flask server on all interfaces for local or container deployment.
    app.run(host=HOST, port=PORT)
