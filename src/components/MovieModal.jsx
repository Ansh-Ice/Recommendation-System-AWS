const PLACEHOLDER_POSTER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23e7eef5'/%3E%3Ccircle cx='150' cy='170' r='44' fill='%2391a4b8'/%3E%3Cpath d='M95 288c18-34 42-51 55-51 18 0 37 17 55 51' fill='none' stroke='%2391a4b8' stroke-width='18' stroke-linecap='round'/%3E%3Ctext x='150' y='356' text-anchor='middle' fill='%23506a82' font-family='Segoe UI, Arial, sans-serif' font-size='28' font-weight='700'%3ENo Poster%3C/text%3E%3C/svg%3E";

function MovieModal({
  movie,
  isOpen,
  onClose,
  onLike,
  liking,
  likeMessage,
  isLiked,
}) {
  if (!isOpen || !movie) {
    return null;
  }

  const title = movie.title || "Untitled movie";
  const posterSource = movie.poster || movie.poster_url || PLACEHOLDER_POSTER;
  const overview = movie.overview || "No description available";

  return (
    <div className="movie-modal__overlay" onClick={onClose} role="presentation">
      <div
        className="movie-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-modal-title"
      >
        <button className="movie-modal__close" type="button" onClick={onClose}>
          Close
        </button>

        <div className="movie-modal__body">
          <img
            className="movie-modal__poster"
            src={posterSource}
            alt={`${title} poster`}
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER_POSTER;
            }}
          />

          <div className="movie-modal__content">
            <h2 id="movie-modal-title" className="movie-modal__title">
              {title}
            </h2>
            <p className="movie-modal__overview">{overview}</p>

            <div className="movie-modal__actions">
              <button
                className="movie-modal__like"
                type="button"
                onClick={onLike}
                disabled={liking || isLiked}
              >
                {isLiked ? "Liked <3" : liking ? "Saving..." : "Like <3"}
              </button>

              {likeMessage ? <p className="movie-modal__message">{likeMessage}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
