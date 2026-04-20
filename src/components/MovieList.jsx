import { motion } from "framer-motion";

const PLACEHOLDER_POSTER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23161224'/%3E%3Ccircle cx='150' cy='170' r='44' fill='%232e1a47'/%3E%3Cpath d='M95 288c18-34 42-51 55-51 18 0 37 17 55 51' fill='none' stroke='%232e1a47' stroke-width='18' stroke-linecap='round'/%3E%3Ctext x='150' y='356' text-anchor='middle' fill='%23a78bfa' font-family='Segoe UI, Arial, sans-serif' font-size='28' font-weight='700'%3ENo Poster%3C/text%3E%3C/svg%3E";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

function MovieList({
  movies,
  onMovieSelect,
  heading = "Curated Discoveries",
  description = "Based on your cinematic tastes, here are the finest selections.",
  showHeading = true,
}) {
  if (!movies.length) {
    return null;
  }

  return (
    <section className="section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }} aria-live="polite">
      {showHeading ? (
        <motion.div 
          className="section-heading text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{heading}</h2>
          <p className="mx-auto" style={{ maxWidth: '600px', fontSize: '1.2rem' }}>{description}</p>
        </motion.div>
      ) : null}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
          gap: '2rem',
          padding: '2rem 0'
        }}
      >
        {movies.map((movie, index) => {
          const title = typeof movie === "string" ? movie : movie.title;
          const overview =
            typeof movie === "string"
              ? "A hidden gem waiting to be discovered."
              : movie.overview || "A hidden gem waiting to be discovered.";
          const posterSource =
            typeof movie === "string"
              ? PLACEHOLDER_POSTER
              : movie.poster || movie.poster_url || PLACEHOLDER_POSTER;

          return (
            <motion.button
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                y: -10, 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(167, 139, 250, 0.2)' 
              }}
              whileTap={{ scale: 0.98 }}
              key={`${title}-${index}`}
              style={{
                position: 'relative',
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius-lg)',
                overflow: 'hidden',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
              onClick={() => onMovieSelect?.(typeof movie === "string" ? { title } : movie)}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to top, var(--color-bg-surface) 0%, transparent 50%)',
                  zIndex: 1
                }} />
                <motion.img
                  src={posterSource}
                  alt={`${title} poster`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER_POSTER;
                  }}
                />
                <span style={{
                  position: 'absolute', top: '1rem', right: '1rem', zIndex: 2,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  color: 'var(--color-secondary)', padding: '0.25rem 0.75rem',
                  borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600,
                  border: '1px solid rgba(252, 211, 77, 0.3)'
                }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 2 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  {title}
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', color: 'var(--color-text-secondary)', 
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden', margin: 0 
                }}>
                  {overview}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}

export default MovieList;
