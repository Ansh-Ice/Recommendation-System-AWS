const PLACEHOLDER_POSTER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23e7eef5'/%3E%3Ccircle cx='150' cy='170' r='44' fill='%2391a4b8'/%3E%3Cpath d='M95 288c18-34 42-51 55-51 18 0 37 17 55 51' fill='none' stroke='%2391a4b8' stroke-width='18' stroke-linecap='round'/%3E%3Ctext x='150' y='356' text-anchor='middle' fill='%23506a82' font-family='Segoe UI, Arial, sans-serif' font-size='28' font-weight='700'%3ENo Poster%3C/text%3E%3C/svg%3E";

function MovieList({ movies, onMovieSelect }) {
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
        {movies.map((movie, index) => {
          const title = typeof movie === "string" ? movie : movie.title;
          const overview =
            typeof movie === "string"
              ? "No description available"
              : movie.overview || "No description available";
          const posterSource =
            typeof movie === "string"
              ? PLACEHOLDER_POSTER
              : movie.poster || movie.poster_url || PLACEHOLDER_POSTER;

          return (
            <button
              key={`${title}-${index}`}
              className="movie-card"
              type="button"
              onClick={() => onMovieSelect?.(typeof movie === "string" ? { title } : movie)}
            >
              <span className="movie-card__index">{String(index + 1).padStart(2, "0")}</span>
              <img
                className="movie-card__poster"
                src={posterSource}
                alt={`${title} poster`}
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_POSTER;
                }}
              />
              <div className="movie-card__content">
                <h3 className="movie-card__title">{title}</h3>
                <p className="movie-card__overview">{overview}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MovieList;
