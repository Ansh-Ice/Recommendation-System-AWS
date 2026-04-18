"""Service exports for recommendation-related logic."""

from .recommendation_service import (
    MovieNotFoundError,
    RecommendationError,
    RecommendationService,
)

__all__ = [
    "MovieNotFoundError",
    "RecommendationError",
    "RecommendationService",
]
