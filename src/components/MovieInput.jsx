function MovieInput({
  value,
  onChange,
  onSubmit,
  loading,
  suggestions,
  suggestionsLoading,
  suggestionsError,
  onSuggestionSelect,
}) {
  const showSuggestions =
    value.trim().length > 1 &&
    (suggestions.length > 0 || suggestionsLoading || Boolean(suggestionsError));

  return (
    <form className="search-panel" onSubmit={onSubmit}>
      <label className="search-panel__label" htmlFor="movie-name">
        Search for a movie
      </label>

      <div className="search-panel__controls">
        <div className="search-panel__field">
          <input
            id="movie-name"
            className="search-panel__input"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Enter a movie title"
            autoComplete="off"
          />

          {showSuggestions ? (
            <div className="suggestions-dropdown">
              {suggestionsLoading ? (
                <p className="suggestions-dropdown__status">Loading suggestions...</p>
              ) : null}

              {!suggestionsLoading && suggestionsError ? (
                <p className="suggestions-dropdown__status suggestions-dropdown__status--error">
                  {suggestionsError}
                </p>
              ) : null}

              {!suggestionsLoading && !suggestionsError && suggestions.length ? (
                <ul className="suggestions-dropdown__list">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.movie_id ?? suggestion.title}>
                      <button
                        className="suggestions-dropdown__item"
                        type="button"
                        onClick={() => onSuggestionSelect(suggestion.title)}
                      >
                        <span className="suggestions-dropdown__title">{suggestion.title}</span>
                        {suggestion.genres?.length ? (
                          <span className="suggestions-dropdown__meta">
                            {suggestion.genres.join(", ")}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <button className="search-panel__button" type="submit" disabled={loading}>
          {loading ? "Searching..." : "Get Recommendations"}
        </button>
      </div>
    </form>
  );
}

export default MovieInput;
