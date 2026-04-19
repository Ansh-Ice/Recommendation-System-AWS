import { useEffect, useRef, useState } from "react";
import MovieInput from "../components/MovieInput";
import MovieList from "../components/MovieList";
import {
  fetchMovieSuggestions,
  fetchRecommendations,
} from "../services/api";

function HomePage() {
  const [movieName, setMovieName] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [searchedMovie, setSearchedMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const latestSuggestionRequest = useRef(0);

  useEffect(() => {
    const trimmedMovieName = movieName.trim();

    if (!showSuggestions || trimmedMovieName.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return undefined;
    }

    const controller = new AbortController();
    const requestId = latestSuggestionRequest.current + 1;
    latestSuggestionRequest.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      setSuggestionsError("");

      try {
        const data = await fetchMovieSuggestions(trimmedMovieName, {
          signal: controller.signal,
        });

        if (latestSuggestionRequest.current !== requestId) {
          return;
        }

        setSuggestions(data.results ?? []);
      } catch (requestError) {
        if (requestError.name === "AbortError") {
          return;
        }

        if (latestSuggestionRequest.current !== requestId) {
          return;
        }

        setSuggestions([]);
        setSuggestionsError(
          requestError.message || "Unable to load movie suggestions right now.",
        );
      } finally {
        if (latestSuggestionRequest.current === requestId) {
          setSuggestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [movieName]);

  const runRecommendationSearch = async (selectedMovieName) => {
    const trimmedMovieName = selectedMovieName.trim();
    if (!trimmedMovieName) {
      setRecommendations([]);
      setSearchedMovie("");
      setError("Please enter a movie name before searching.");
      return;
    }

    setShowSuggestions(false);
    setLoading(true);
    setError("");
    setRecommendations([]);
    setSuggestions([]);
    setSuggestionsError("");
    setSearchedMovie(trimmedMovieName);

    try {
      const data = await fetchRecommendations(trimmedMovieName);
      setRecommendations(data.recommendations ?? []);
    } catch (requestError) {
      setSearchedMovie("");
      setError(requestError.message || "Something went wrong while fetching recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runRecommendationSearch(movieName);
  };

  const handleSuggestionSelect = async (selectedTitle) => {
    setMovieName(selectedTitle);
    await runRecommendationSearch(selectedTitle);
  };

  const handleMovieNameChange = (value) => {
    setMovieName(value);
    setShowSuggestions(true);
    setSuggestionsError("");
  };

  return (
    <section className="page page--home">
      <div className="hero">
        <div className="hero__content">
          <span className="hero__eyebrow">Movie Recommendation System</span>
          <h1>Find your next movie in one search.</h1>
          <p>
            Enter a title, send it to the backend recommendation API, and view similar
            movies in a clean, simple layout.
          </p>
        </div>
      </div>

      <div className="content-panel">
        <MovieInput
          value={movieName}
          onChange={handleMovieNameChange}
          onSubmit={handleSubmit}
          loading={loading}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          suggestionsError={suggestionsError}
          onSuggestionSelect={handleSuggestionSelect}
        />

        {loading ? <p className="status-message">Loading recommendations...</p> : null}

        {error ? <p className="status-message status-message--error">{error}</p> : null}

        {!loading && !error && searchedMovie && !recommendations.length ? (
          <p className="status-message">
            No recommendations were returned for <strong>{searchedMovie}</strong>.
          </p>
        ) : null}

        <MovieList movies={recommendations} />
      </div>
    </section>
  );
}

export default HomePage;
