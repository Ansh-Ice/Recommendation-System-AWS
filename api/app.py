"""Flask application entry point for the movie recommendation API."""

import logging

from flask import Flask, jsonify, request

try:
    from .config import HOST, PORT, MOVIES_PATH, SIMILARITY_PATH
    from .services import (
        MovieNotFoundError,
        RecommendationError,
        RecommendationService,
    )
except ImportError:
    from config import HOST, PORT, MOVIES_PATH, SIMILARITY_PATH
    from services import (
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

    # Load the model artifacts once during startup so every request can reuse them.
    recommender = RecommendationService(
        movies_path=MOVIES_PATH,
        similarity_path=SIMILARITY_PATH,
    )
    app.config["RECOMMENDER_SERVICE"] = recommender

    @app.get("/")
    def home():
        """Simple root endpoint to confirm the API is running."""
        return "Movie Recommendation API is running", 200

    @app.get("/recommend")
    def recommend_movies():
        """Return the top movie recommendations for a given title."""
        movie_name = request.args.get("movie", "").strip()

        # Guard against missing query parameters before touching the model.
        if not movie_name:
            return jsonify({"error": "Missing required query parameter: movie"}), 400

        try:
            recommendations = recommender.recommend(movie_name)
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
