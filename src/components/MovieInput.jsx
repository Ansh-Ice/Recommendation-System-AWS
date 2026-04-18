function MovieInput({ value, onChange, onSubmit, loading }) {
  return (
    <form className="search-panel" onSubmit={onSubmit}>
      <label className="search-panel__label" htmlFor="movie-name">
        Search for a movie
      </label>

      <div className="search-panel__controls">
        <input
          id="movie-name"
          className="search-panel__input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter a movie title"
          autoComplete="off"
        />

        <button className="search-panel__button" type="submit" disabled={loading}>
          {loading ? "Searching..." : "Get Recommendations"}
        </button>
      </div>
    </form>
  );
}

export default MovieInput;
