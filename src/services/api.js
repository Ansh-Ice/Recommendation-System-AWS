const BASE_URL = "http://13.60.44.173:5000";

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
