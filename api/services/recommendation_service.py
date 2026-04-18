"""Recommendation service that loads artifacts and returns similar movies."""

import logging
import pickle
from pathlib import Path
from typing import List

import pandas as pd


class RecommendationError(Exception):
    """Base exception for recommendation-related errors."""


class MovieNotFoundError(RecommendationError):
    """Raised when a requested movie is not present in the dataset."""


class RecommendationService:
    """Encapsulates artifact loading and movie recommendation logic."""

    def __init__(self, movies_path: Path, similarity_path: Path) -> None:
        self.logger = logging.getLogger(self.__class__.__name__)
        self.movies_path = Path(movies_path)
        self.similarity_path = Path(similarity_path)
        self.movies: pd.DataFrame
        self.similarity = None
        self._title_to_index = {}
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Load and validate the serialized movie dataframe and similarity matrix."""
        if not self.movies_path.exists():
            raise FileNotFoundError(f"Movies artifact not found: {self.movies_path}")

        if not self.similarity_path.exists():
            raise FileNotFoundError(
                f"Similarity artifact not found: {self.similarity_path}"
            )

        # Deserialize the movie dataframe used for title lookup.
        with self.movies_path.open("rb") as movies_file:
            movies = pickle.load(movies_file)

        # Deserialize the similarity matrix used for ranking recommendations.
        with self.similarity_path.open("rb") as similarity_file:
            similarity = pickle.load(similarity_file)

        if not isinstance(movies, pd.DataFrame):
            raise TypeError("movies.pkl must contain a pandas DataFrame.")

        if "title" not in movies.columns:
            raise ValueError("movies.pkl must include a 'title' column.")

        if not hasattr(similarity, "shape"):
            raise TypeError("similarity.pkl must contain a matrix-like object.")

        if len(movies) != similarity.shape[0]:
            raise ValueError(
                "The similarity matrix row count must match the number of movies."
            )

        self.movies = movies.reset_index(drop=True)
        self.similarity = similarity

        # Build a normalized lookup table for fast, case-insensitive movie searches.
        self._title_to_index = {
            str(title).strip().lower(): index
            for index, title in self.movies["title"].items()
        }

        self.logger.info(
            "Loaded %s movies and a %s similarity matrix.",
            len(self.movies),
            getattr(self.similarity, "shape", None),
        )

    def recommend(self, movie_name: str, limit: int = 5) -> List[str]:
        """Return the top similar movie titles for the supplied movie name."""
        normalized_title = movie_name.strip().lower()
        if not normalized_title:
            raise RecommendationError("Movie name cannot be empty.")

        movie_index = self._title_to_index.get(normalized_title)
        if movie_index is None:
            raise MovieNotFoundError(
                f"Movie '{movie_name}' was not found in the recommendation dataset."
            )

        # Pair each movie index with its similarity score to the requested title.
        similarity_scores = list(enumerate(self.similarity[movie_index]))

        # Rank the movies from most similar to least similar.
        ranked_scores = sorted(
            similarity_scores,
            key=lambda score: score[1],
            reverse=True,
        )

        recommendations: List[str] = []

        # Skip the input movie itself and collect only the requested number of titles.
        for candidate_index, _score in ranked_scores:
            if candidate_index == movie_index:
                continue

            recommendations.append(self.movies.iloc[candidate_index]["title"])

            if len(recommendations) == limit:
                break

        return recommendations
