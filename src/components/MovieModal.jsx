import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Play } from "lucide-react";
import { useEffect } from "react";

const PLACEHOLDER_POSTER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23161224'/%3E%3Ccircle cx='150' cy='170' r='44' fill='%232e1a47'/%3E%3Cpath d='M95 288c18-34 42-51 55-51 18 0 37 17 55 51' fill='none' stroke='%232e1a47' stroke-width='18' stroke-linecap='round'/%3E%3Ctext x='150' y='356' text-anchor='middle' fill='%23a78bfa' font-family='Segoe UI, Arial, sans-serif' font-size='28' font-weight='700'%3ENo Poster%3C/text%3E%3C/svg%3E";

function MovieModal({
  movie,
  isOpen,
  onClose,
  onLike,
  liking,
  likeMessage,
  isLiked,
}) {
  
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const title = movie?.title || "Untitled movie";
  const posterSource = movie?.poster || movie?.poster_url || PLACEHOLDER_POSTER;
  const overview = movie?.overview || "No description available";

  return (
    <AnimatePresence>
      {isOpen && movie && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(10, 8, 18, 0.8)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '900px',
              background: 'var(--color-bg-base)',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-glow)',
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid var(--color-border)',
              zIndex: 1001,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button 
              onClick={onClose}
              style={{
                position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                width: '40px', height: '40px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
            >
              <X size={24} />
            </button>

            <div style={{ width: '40%', position: 'relative' }}>
              <img
                src={posterSource}
                alt={`${title} poster`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_POSTER;
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, var(--color-bg-base))' }} />
            </div>

            <div style={{ width: '60%', padding: '3rem 2rem', display: 'flex', flexDirection: 'column' }}>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>
                  {title}
                </h2>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>
                  {overview}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <button
                  className="btn btn--primary"
                  onClick={onLike}
                  disabled={liking}
                  style={{ 
                    padding: '1rem 2rem', fontSize: '1.1rem', cursor: liking ? 'wait' : 'pointer',
                    background: isLiked ? 'rgba(236, 72, 153, 0.2)' : 'var(--color-primary)',
                    color: isLiked ? '#ec4899' : '#fff',
                    borderColor: isLiked ? '#ec4899' : 'transparent',
                    boxShadow: isLiked ? 'none' : '0 4px 15px var(--color-primary-glow)'
                  }}
                >
                  <Heart fill={isLiked ? "#ec4899" : "transparent"} size={20} />
                  {liking ? "Processing..." : isLiked ? "Remove from Collection" : "Add to Favorites"}
                </button>
                
                {likeMessage && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginLeft: '1rem' }}>
                    {likeMessage}
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default MovieModal;
