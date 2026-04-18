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
          <article key={`${movie}-${index}`} className="movie-card">
            <span className="movie-card__index">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="movie-card__title">{movie}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MovieList;
