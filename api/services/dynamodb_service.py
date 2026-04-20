"""DynamoDB helpers for movie metadata and search."""

import logging
from typing import Dict, Iterable, List, Optional

import boto3
from boto3.dynamodb.conditions import Attr


class DynamoDBService:
    """Wrap DynamoDB table access for movie and user data."""

    def __init__(
        self,
        region_name: str = "eu-north-1",
        movies_table_name: str = "movies",
        users_table_name: str = "users",
    ) -> None:
        self.logger = logging.getLogger(self.__class__.__name__)
        self.region_name = region_name
        self.movies_table_name = movies_table_name
        self.users_table_name = users_table_name
        self._dynamodb = None
        self._movies_table = None
        self._users_table = None

    def _get_dynamodb(self):
        """Create the DynamoDB resource lazily to avoid startup failures."""
        if self._dynamodb is None:
            self._dynamodb = boto3.resource("dynamodb", region_name=self.region_name)
        return self._dynamodb

    def _get_movies_table(self):
        """Return the configured movies table reference."""
        if self._movies_table is None:
            self._movies_table = self._get_dynamodb().Table(self.movies_table_name)
        return self._movies_table

    def _get_users_table(self):
        """Return the configured users table reference."""
        if self._users_table is None:
            self._users_table = self._get_dynamodb().Table(self.users_table_name)
        return self._users_table

    def _scan_movies(self, projection_expression: Optional[str] = None) -> List[Dict]:
        """Scan the movies table and collect all returned items."""
        scan_kwargs = {}
        if projection_expression:
            scan_kwargs["ProjectionExpression"] = projection_expression

        response = self._get_movies_table().scan(**scan_kwargs)
        items = response.get("Items", [])

        while "LastEvaluatedKey" in response:
            scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
            response = self._get_movies_table().scan(**scan_kwargs)
            items.extend(response.get("Items", []))

        return items

    def add_movie(self, movie: Dict) -> Dict:
        """Insert a single movie item into DynamoDB."""
        self._get_movies_table().put_item(Item=movie)
        return movie

    def add_movies(self, movies: Iterable[Dict]) -> int:
        """Insert multiple movie items into DynamoDB using a batch writer."""
        inserted_count = 0
        with self._get_movies_table().batch_writer() as batch:
            for movie in movies:
                batch.put_item(Item=movie)
                inserted_count += 1
        return inserted_count

    def search_movies(self, query: str, limit: int = 10) -> List[Dict]:
        """Return movie suggestions whose titles contain the supplied text."""
        normalized_query = query.strip()
        if len(normalized_query) < 2:
            return []
        filter_expression = Attr("title").contains(normalized_query)
        title_case_query = normalized_query.title()
        if title_case_query != normalized_query:
            filter_expression = filter_expression | Attr("title").contains(
                title_case_query
            )

        response = self._get_movies_table().scan(
            FilterExpression=filter_expression,
            ProjectionExpression="movie_id, title, genres, overview, poster_url",
            Limit=limit,
        )
        matches = response.get("Items", [])

        ranked_items = sorted(
            matches,
            key=lambda item: (
                str(item.get("title", "")).lower().find(normalized_query.lower()) != 0,
                len(str(item.get("title", ""))),
                str(item.get("title", "")).lower(),
            ),
        )
        return ranked_items[:limit]

    def get_movie_by_title(self, title: str) -> Optional[Dict]:
        """Fetch a single movie item by title using a scan."""
        normalized_title = title.strip().lower()
        if not normalized_title:
            return None

        items = self._scan_movies(
            projection_expression="movie_id, title, genres, overview, poster_url, tags"
        )
        for item in items:
            if str(item.get("title", "")).strip().lower() == normalized_title:
                return item
        return None

    def get_movies_by_titles(self, titles: Iterable[str]) -> Dict[str, Dict]:
        """Fetch movie metadata for the supplied titles."""
        unique_titles = [
            title.strip().lower() for title in dict.fromkeys(titles) if title.strip()
        ]
        if not unique_titles:
            return {}

        items = self._scan_movies(
            projection_expression="movie_id, title, genres, overview, poster_url, tags"
        )
        return {
            str(item.get("title", "")).strip().lower(): item
            for item in items
            if str(item.get("title", "")).strip().lower() in unique_titles
        }

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Fetch a user record from the users table."""
        if not user_id.strip():
            return None

        response = self._get_users_table().get_item(Key={"user_id": user_id})
        return response.get("Item")

    def create_user(self, user_id: str, password: str) -> Dict:
        """Create a new user record with an empty liked movies list."""
        normalized_user_id = user_id.strip()
        if not normalized_user_id:
            raise ValueError("user_id cannot be empty.")
        if not password:
            raise ValueError("password cannot be empty.")
        if self.get_user(normalized_user_id):
            raise ValueError("User already exists.")

        user_record = {
            "user_id": normalized_user_id,
            "password": password,
            "liked_movies": [],
        }
        self._get_users_table().put_item(Item=user_record)
        return user_record

    def validate_user(self, user_id: str, password: str) -> bool:
        """Validate a user's credentials against DynamoDB."""
        normalized_user_id = user_id.strip()
        if not normalized_user_id or not password:
            return False

        user = self.get_user(normalized_user_id)
        if not user:
            return False

        return str(user.get("password", "")) == password

    def like_movie(self, user_id: str, movie: Dict) -> Dict:
        """Store a liked movie for a user, avoiding duplicates."""
        normalized_user_id = user_id.strip()
        if not normalized_user_id:
            raise ValueError("user_id cannot be empty.")

        existing_user = self.get_user(normalized_user_id) or {
            "user_id": normalized_user_id,
            "liked_movies": [],
        }
        liked_movies = list(existing_user.get("liked_movies", []))

        movie_id = str(movie.get("movie_id", "")).strip()
        movie_title = str(movie.get("title", "")).strip().lower()

        already_liked = any(
            str(liked_movie.get("movie_id", "")).strip() == movie_id
            if movie_id
            else str(liked_movie.get("title", "")).strip().lower() == movie_title
            for liked_movie in liked_movies
        )

        if not already_liked:
            liked_movies.append(movie)

        user_record = {
            "user_id": normalized_user_id,
            "password": existing_user.get("password", ""),
            "liked_movies": liked_movies,
        }
        self._get_users_table().put_item(Item=user_record)
        return user_record

    def unlike_movie(self, user_id: str, movie_title: str) -> Dict:
        """Remove a liked movie for a user by title."""
        normalized_user_id = user_id.strip()
        if not normalized_user_id:
            raise ValueError("user_id cannot be empty.")

        existing_user = self.get_user(normalized_user_id)
        if not existing_user:
            return {}

        liked_movies = list(existing_user.get("liked_movies", []))
        normalized_title = movie_title.strip().lower()

        filtered_movies = [
            m for m in liked_movies
            if str(m.get("title", "")).strip().lower() != normalized_title
        ]

        if len(filtered_movies) != len(liked_movies):
            user_record = {
                "user_id": normalized_user_id,
                "password": existing_user.get("password", ""),
                "liked_movies": filtered_movies,
            }
            self._get_users_table().put_item(Item=user_record)
            return user_record
        
        return existing_user
