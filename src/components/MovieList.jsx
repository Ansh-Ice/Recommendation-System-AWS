function MovieList({ movies }) {
  if (!movies.length) {
    return null;
  }

  return (
    <section className="results-section" aria-live="polite">
      <div className="section-heading">
        <h2>Recommended Movies</h2>
        <p>Based on your selected title, here are the top matches from the backend.</p>
      </div>

      <div className="movie-grid">
        {movies.map((movie, index) => (
          <article
            key={`${typeof movie === "string" ? movie : movie.title}-${index}`}
            className="movie-card"
          >
            <span className="movie-card__index">{String(index + 1).padStart(2, "0")}</span>

            {movie.poster_url ? (
              <img
                className="movie-card__poster"
                src={movie.poster_url}
                alt={`${movie.title} poster`}
              />
            ) : (
              <div className="movie-card__poster movie-card__poster--placeholder">
                <span>No Poster</span>
              </div>
            )}

            <div className="movie-card__content">
              <h3 className="movie-card__title">
                {typeof movie === "string" ? movie : movie.title}
              </h3>
              <p className="movie-card__overview">
                {typeof movie === "string"
                  ? "No additional movie details are available yet."
                  : movie.overview || "No overview available for this recommendation."}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MovieList;
