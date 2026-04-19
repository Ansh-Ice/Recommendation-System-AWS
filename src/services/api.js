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
  const requestUrl = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;

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

  return data;
}
