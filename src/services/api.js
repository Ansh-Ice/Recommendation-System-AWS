import { BASE_URL } from "../config";

export async function fetchRecommendations(movieName) {
  const requestUrl = `${BASE_URL}/recommend?movie=${encodeURIComponent(movieName)}`;

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch movie recommendations.");
  }

  return data;
}

export async function fetchMovieSuggestions(query, options = {}) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return { query: trimmedQuery, results: [] };
  }

  const requestUrl = `${BASE_URL}/search?query=${encodeURIComponent(trimmedQuery)}`;

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: options.signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch movie suggestions.");
  }

  return {
    ...data,
    results: Array.isArray(data.results) ? data.results.slice(0, 10) : [],
  };
}

export async function likeMovie(movie, userId = "demo_user") {
  const response = await fetch(`${BASE_URL}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      movie,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to like this movie.");
  }

  return data;
}
