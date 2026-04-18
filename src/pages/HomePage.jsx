import { useState } from "react";
import MovieInput from "../components/MovieInput";
import MovieList from "../components/MovieList";
import { fetchRecommendations } from "../services/api";

function HomePage() {
  const [movieName, setMovieName] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [searchedMovie, setSearchedMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMovieName = movieName.trim();
    if (!trimmedMovieName) {
      setRecommendations([]);
      setSearchedMovie("");
      setError("Please enter a movie name before searching.");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendations([]);
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
          onChange={setMovieName}
          onSubmit={handleSubmit}
          loading={loading}
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
