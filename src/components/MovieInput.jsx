import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

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
    <form style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative' }} onSubmit={onSubmit}>
      <motion.div 
        className="glass-panel"
        style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: 'var(--border-radius-full)', alignItems: 'center' }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Search className="text-gradient" style={{ marginLeft: '1rem', color: 'var(--color-primary)' }} size={24} />
        <input
          id="movie-name"
          style={{
            flex: 1, background: 'transparent', border: 'none', color: 'var(--color-text-primary)',
            fontSize: '1.25rem', padding: '1rem', outline: 'none'
          }}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter a movie title to discover magic..."
          autoComplete="off"
        />
        {value.length > 0 && (
          <button 
            type="button" 
            onClick={() => { onChange(""); document.getElementById("movie-name").focus(); }}
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--color-text-muted)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', marginRight: '0.5rem'
            }}
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
        <button className="btn btn--primary" type="submit" disabled={loading} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          {loading ? (
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'inline-block' }}>
               <Search size={20} />
             </motion.div>
          ) : "Discover"}
        </button>
      </motion.div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="suggestions-box"
            style={{ 
              position: 'absolute', top: 'calc(100% + 1rem)', left: '0', right: '0',
            }}
          >
            {suggestionsLoading ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>Sifting through the cinematic universe...</p>
            ) : null}

            {!suggestionsLoading && suggestionsError ? (
              <p style={{ color: '#ef4444', textAlign: 'center', padding: '1rem' }}>
                {suggestionsError}
              </p>
            ) : null}

            {!suggestionsLoading && !suggestionsError && suggestions.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {suggestions.map((suggestion) => (
                  <motion.li key={suggestion.movie_id ?? suggestion.title} whileHover={{ x: 5 }}>
                    <button
                      type="button"
                      onClick={() => onSuggestionSelect(suggestion.title)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                        color: 'var(--color-text-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-border)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{suggestion.title}</span>
                      {suggestion.genres?.length ? (
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', background: 'rgba(167, 139, 250, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {suggestion.genres.slice(0, 2).join(", ")}
                        </span>
                      ) : null}
                    </button>
                  </motion.li>
                ))}
              </ul>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

export default MovieInput;
