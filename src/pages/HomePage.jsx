import { useEffect, useRef, useState } from "react";
import MovieInput from "../components/MovieInput";
import MovieList from "../components/MovieList";
import MovieModal from "../components/MovieModal";
import {
  fetchLikedMovies,
  fetchMovieSuggestions,
  fetchUserRecommendations,
  getStoredUserId,
  likeMovie,
  fetchRecommendations,
} from "../services/api";

function HomePage() {
  const userId = getStoredUserId();
  const [movieName, setMovieName] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [searchedMovie, setSearchedMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [likedMovieKeys, setLikedMovieKeys] = useState([]);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");
  const [likedMovies, setLikedMovies] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [basedOnMovie, setBasedOnMovie] = useState("");
  const [userSectionsLoading, setUserSectionsLoading] = useState(true);
  const [userSectionsError, setUserSectionsError] = useState("");
  const latestSuggestionRequest = useRef(0);
  const suggestionCache = useRef(new Map());

  useEffect(() => {
    const trimmedMovieName = movieName.trim();
    const normalizedQuery = trimmedMovieName.toLowerCase();

    if (!showSuggestions || trimmedMovieName.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return undefined;
    }

    if (suggestionCache.current.has(normalizedQuery)) {
      setSuggestions(suggestionCache.current.get(normalizedQuery));
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

        const nextSuggestions = (data.results ?? []).slice(0, 10);
        suggestionCache.current.set(normalizedQuery, nextSuggestions);
        setSuggestions(nextSuggestions);
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
  }, [movieName, showSuggestions]);

  const loadUserSections = async () => {
    setUserSectionsLoading(true);
    setUserSectionsError("");

    try {
      const [likedResponse, personalizedResponse] = await Promise.all([
        fetchLikedMovies(userId),
        fetchUserRecommendations(userId),
      ]);

      const nextLikedMovies = likedResponse.liked_movies ?? [];
      setLikedMovies(nextLikedMovies);
      setLikedMovieKeys(
        nextLikedMovies.map((movie) => movie.movie_id || movie.title || ""),
      );
      setBasedOnMovie(personalizedResponse.based_on || "");
      setPersonalizedRecommendations(personalizedResponse.recommendations ?? []);
    } catch (requestError) {
      setUserSectionsError(
        requestError.message || "Unable to load your movie activity right now.",
      );
    } finally {
      setUserSectionsLoading(false);
    }
  };

  useEffect(() => {
    loadUserSections();
  }, []);

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

  const getMovieKey = (movie) => movie.movie_id || movie.title || "";

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setLikeMessage("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLikeLoading(false);
    setLikeMessage("");
  };

  const handleLikeMovie = async () => {
    if (!selectedMovie) {
      return;
    }

    setLikeLoading(true);
    setLikeMessage("");

    try {
      await likeMovie(selectedMovie, userId);
      const movieKey = getMovieKey(selectedMovie);
      setLikedMovieKeys((currentKeys) =>
        currentKeys.includes(movieKey) ? currentKeys : [...currentKeys, movieKey],
      );
      setLikeMessage("Movie saved to your likes.");
      await loadUserSections();
    } catch (requestError) {
      setLikeMessage(requestError.message || "Unable to save this movie right now.");
    } finally {
      setLikeLoading(false);
    }
  };

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showModal]);

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

        <MovieList movies={recommendations} onMovieSelect={handleMovieSelect} />
      </div>

      <div className="content-panel">
        <div className="section-heading">
          <h2>Your Liked Movies</h2>
          <p>Movies saved from your recent exploration.</p>
        </div>

        {userSectionsLoading ? (
          <p className="status-message">Loading your movie activity...</p>
        ) : null}

        {!userSectionsLoading && userSectionsError ? (
          <p className="status-message status-message--error">{userSectionsError}</p>
        ) : null}

        {!userSectionsLoading && !userSectionsError && !likedMovies.length ? (
          <p className="status-message">
            You have not liked any movies yet. Open a movie card and save one to get
            started.
          </p>
        ) : null}

        {!userSectionsLoading && !userSectionsError && likedMovies.length ? (
          <MovieList
            movies={likedMovies}
            onMovieSelect={handleMovieSelect}
            showHeading={false}
          />
        ) : null}
      </div>

      <div className="content-panel">
        <div className="section-heading">
          <h2>
            {basedOnMovie
              ? `Because you liked ${basedOnMovie}`
              : "Personalized Recommendations"}
          </h2>
          <p>Fresh picks generated from your most recently liked movie.</p>
        </div>

        {!userSectionsLoading && !userSectionsError && !personalizedRecommendations.length ? (
          <p className="status-message">
            Like a movie to unlock personalized recommendations here.
          </p>
        ) : null}

        {!userSectionsLoading && !userSectionsError && personalizedRecommendations.length ? (
          <MovieList
            movies={personalizedRecommendations}
            onMovieSelect={handleMovieSelect}
            showHeading={false}
          />
        ) : null}
      </div>

      <MovieModal
        movie={selectedMovie}
        isOpen={showModal}
        onClose={handleCloseModal}
        onLike={handleLikeMovie}
        liking={likeLoading}
        likeMessage={likeMessage}
        isLiked={selectedMovie ? likedMovieKeys.includes(getMovieKey(selectedMovie)) : false}
      />
    </section>
  );
}

export default HomePage;
