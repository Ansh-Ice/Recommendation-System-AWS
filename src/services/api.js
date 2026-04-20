import { BASE_URL } from "../config";

export function getStoredUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem("user_id") || "";
}

export function setStoredUserId(userId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("user_id", userId);
}

export function clearStoredUserId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("user_id");
}

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
  const resolvedUserId = userId || getStoredUserId();
  const response = await fetch(`${BASE_URL}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user_id: resolvedUserId,
      movie,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to like this movie.");
  }

  return data;
}

export async function unlikeMovie(movieTitle, userId = "demo_user") {
  const resolvedUserId = userId || getStoredUserId();
  const response = await fetch(`${BASE_URL}/unlike`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user_id: resolvedUserId,
      movie_title: movieTitle,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to unlike this movie.");
  }

  return data;
}

export async function fetchLikedMovies(userId = "demo_user") {
  const resolvedUserId = userId || getStoredUserId();
  const response = await fetch(
    `${BASE_URL}/user/${encodeURIComponent(resolvedUserId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch liked movies.");
  }

  return {
    liked_movies: Array.isArray(data.liked_movies) ? data.liked_movies : [],
  };
}

export async function fetchUserRecommendations(userId = "demo_user") {
  const resolvedUserId = userId || getStoredUserId();
  const response = await fetch(
    `${BASE_URL}/recommend/user/${encodeURIComponent(resolvedUserId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch personalized recommendations.");
  }

  return {
    based_on: data.based_on || "",
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
  };
}

export async function loginUser(userId, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      password,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Invalid credentials");
  }

  return data;
}

export async function signupUser(userId, password) {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      password,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to create account.");
  }

  return data;
}

export async function fetchTrendingMovies() {
  const response = await fetch(`${BASE_URL}/trending`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch trending movies.");
  }

  return {
    trending: Array.isArray(data.trending) ? data.trending : [],
  };
}

export async function fetchGenreMovies(genre) {
  const response = await fetch(`${BASE_URL}/genre/${encodeURIComponent(genre)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch genre movies.");
  }

  return {
    results: Array.isArray(data.results) ? data.results : [],
  };
}

export async function fetchUserMovieRecommendations(userId = "demo_user") {
  const resolvedUserId = userId || getStoredUserId();
  const response = await fetch(
    `${BASE_URL}/recommend/user/${encodeURIComponent(resolvedUserId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch personalized recommendations.");
  }

  return {
    based_on: data.based_on || "",
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
  };
}
