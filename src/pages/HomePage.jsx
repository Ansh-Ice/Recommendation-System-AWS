import { useEffect, useRef, useState } from "react";
import MovieInput from "../components/MovieInput";
import MovieList from "../components/MovieList";
import MovieModal from "../components/MovieModal";
import {
  fetchLikedMovies,
  fetchMovieSuggestions,
  fetchUserRecommendations,
  likeMovie,
  unlikeMovie,
  fetchRecommendations,
  fetchTrendingMovies,
  fetchGenreMovies,
  fetchUserMovieRecommendations,
} from "../services/api";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Sparkles, Clapperboard, Star, PlayCircle, Layers, Film, Heart, Flame, Zap } from "lucide-react";

function HomePage({ user }) {
  const userId = user;
  const [movieName, setMovieName] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [searchedMovie, setSearchedMovie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [likedMovieKeys, setLikedMovieKeys] = useState([]);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeMessage, setLikeMessage] = useState("");
  const [likedMovies, setLikedMovies] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [basedOnMovie, setBasedOnMovie] = useState("");
  const [userSectionsLoading, setUserSectionsLoading] = useState(true);
  const [userSectionsError, setUserSectionsError] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [dramaMovies, setDramaMovies] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreError, setGenreError] = useState("");
  const latestSuggestionRequest = useRef(0);
  const suggestionCache = useRef(new Map());
  const trendingScrollRef = useRef(null);
  const actionScrollRef = useRef(null);
  const comedyScrollRef = useRef(null);
  const dramaScrollRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  useEffect(() => {
    const trimmedMovieName = movieName.trim();
    const normalizedQuery = trimmedMovieName.toLowerCase();

    if (!showSuggestions || trimmedMovieName.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return undefined;
    }

    if (suggestionCache.current.has(normalizedQuery)) {
      setSuggestions(suggestionCache.current.get(normalizedQuery));
      setSuggestionsLoading(false);
      setSuggestionsError("");
      return undefined;
    }

    const controller = new AbortController();
    const requestId = latestSuggestionRequest.current + 1;
    latestSuggestionRequest.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      setSuggestionsError("");

      try {
        const data = await fetchMovieSuggestions(trimmedMovieName, {
          signal: controller.signal,
        });

        if (latestSuggestionRequest.current !== requestId) {
          return;
        }

        const nextSuggestions = (data.results ?? []).slice(0, 5);
        suggestionCache.current.set(normalizedQuery, nextSuggestions);
        setSuggestions(nextSuggestions);
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        if (latestSuggestionRequest.current !== requestId) return;

        setSuggestions([]);
        setSuggestionsError(requestError.message || "Unable to load movie suggestions.");
      } finally {
        if (latestSuggestionRequest.current === requestId) {
          setSuggestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [movieName, showSuggestions]);

  const loadUserSections = async () => {
    setUserSectionsLoading(true);
    setUserSectionsError("");

    try {
      const [likedResponse, personalizedResponse] = await Promise.all([
        fetchLikedMovies(userId),
        fetchUserRecommendations(userId),
      ]);

      const nextLikedMovies = likedResponse.liked_movies ?? [];
      setLikedMovies(nextLikedMovies);
      setLikedMovieKeys(
        nextLikedMovies.map((movie) => movie.movie_id || movie.title || ""),
      );
      setBasedOnMovie(personalizedResponse.based_on || "");
      setPersonalizedRecommendations(personalizedResponse.recommendations ?? []);
    } catch (requestError) {
      setUserSectionsError(requestError.message || "Unable to load your movie activity.");
    } finally {
      setUserSectionsLoading(false);
    }
  };

  useEffect(() => {
    loadUserSections();
  }, []);

  const loadBrowseSections = async () => {
    setGenreLoading(true);
    setGenreError("");

    try {
      const [trendingData, actionData, comedyData, dramaData] = await Promise.all([
        fetchTrendingMovies(),
        fetchGenreMovies("Action"),
        fetchGenreMovies("Comedy"),
        fetchGenreMovies("Drama"),
      ]);

      setTrendingMovies(trendingData.trending ?? []);
      setActionMovies(actionData.results ?? []);
      setComedyMovies(comedyData.results ?? []);
      setDramaMovies(dramaData.results ?? []);
    } catch (requestError) {
      setGenreError(requestError.message || "Unable to load browse sections.");
    } finally {
      setGenreLoading(false);
    }
  };

  useEffect(() => {
    loadBrowseSections();
  }, []);

  const runRecommendationSearch = async (selectedMovieName) => {
    const trimmedMovieName = selectedMovieName.trim();
    if (!trimmedMovieName) {
      setRecommendations([]);
      setSearchedMovie("");
      setError("Please enter a magic spell (movie name) before searching.");
      return;
    }

    setShowSuggestions(false);
    setLoading(true);
    setError("");
    setRecommendations([]);
    setSuggestions([]);
    setSuggestionsError("");
    setSearchedMovie(trimmedMovieName);

    try {
      const data = await fetchRecommendations(trimmedMovieName);
      setRecommendations(data.recommendations ?? []);
    } catch (requestError) {
      setSearchedMovie("");
      setError(requestError.message || "Something went wrong in the cinematic universe.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runRecommendationSearch(movieName);
  };

  const handleSuggestionSelect = async (selectedTitle) => {
    setMovieName(selectedTitle);
    await runRecommendationSearch(selectedTitle);
  };

  const handleMovieNameChange = (value) => {
    setMovieName(value);
    
    // Automatically return to the initial view if the user clears the input
    if (value.trim() === "") {
      setSearchedMovie("");
      setRecommendations([]);
      setError("");
    }
    
    setShowSuggestions(true);
    setSuggestionsError("");
  };

  const getMovieKey = (movie) => movie.movie_id || movie.title || "";

  const scrollContainer = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setLikeMessage("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLikeLoading(false);
    setLikeMessage("");
  };

  const handleLikeMovie = async () => {
    if (!selectedMovie) return;
    setLikeLoading(true);
    setLikeMessage("");
    
    const movieKey = getMovieKey(selectedMovie);
    const currentlyLiked = likedMovieKeys.includes(movieKey);

    try {
      if (currentlyLiked) {
        await unlikeMovie(selectedMovie.title, userId);
        setLikedMovieKeys((currentKeys) => currentKeys.filter(k => k !== movieKey));
        setLikeMessage("Removed from your collection.");
      } else {
        await likeMovie(selectedMovie, userId);
        setLikedMovieKeys((currentKeys) => [...currentKeys, movieKey]);
        setLikeMessage("Saved to your personal collection.");
      }
      await loadUserSections();
    } catch (requestError) {
      if (requestError.message.includes("Failed to fetch") || requestError.name === "TypeError") {
         setLikeMessage("Error: The /unlike endpoint has not been deployed to the EC2 server yet.");
      } else {
         setLikeMessage(requestError.message || "Unable to process this request.");
      }
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Background Ambience Elements */}
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <div className="bg-blob bg-blob--3" />

      {/* Hero Section */}
      <motion.section 
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', opacity: heroOpacity, y: heroY, position: 'relative', zIndex: 50 }}
        className="container text-center hero-section"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ marginBottom: '2rem' }}
        >
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)',
            padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)'
          }}>
            <Sparkles size={16} className="text-gradient-warm" />
            The ultimate cinematic engine
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Discover your next <br /> <span className="text-gradient">cinematic masterpiece.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto" style={{ fontSize: '1.25rem', marginBottom: '4rem', maxWidth: '700px' }}
        >
          Immerse yourself in our cozy recommendation engine. Type a movie that moves you, and we'll conjure an entire universe of similar stories.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{ width: '100%' }}
        >
          <MovieInput
            value={movieName}
            onChange={handleMovieNameChange}
            onSubmit={handleSubmit}
            loading={loading}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            suggestionsError={suggestionsError}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </motion.div>
      </motion.section>

      {/* Results or Storytelling Section */}
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Dynamic Display */}
        <AnimatePresence mode="wait">
          {searchedMovie && (
            <motion.div 
              key="search-results"
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -50 }}
              style={{ padding: '4rem 0' }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    <PlayCircle size={48} color="var(--color-primary)" opacity={0.5} />
                  </motion.div>
                  <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>Brewing cinematic recommendations...</p>
                </div>
              ) : error ? (
                <div className="glass-panel text-center" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                  <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>{error}</p>
                </div>
              ) : !recommendations.length ? (
                <div className="glass-panel text-center" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    Even the archives failed to find matches for <strong>{searchedMovie}</strong>.
                  </p>
                </div>
              ) : (
                <MovieList 
                  movies={recommendations} 
                  onMovieSelect={handleMovieSelect} 
                  heading={`Inspired by ${searchedMovie}`}
                  description="Hand-picked tales matching the spirit of your search."
                />
              )}
            </motion.div>
          )}

          {!searchedMovie && (
            <motion.section 
              key="story-section"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
              style={{ padding: '6rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
                <div style={{ flex: '1 1 400px' }}>
                  <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>A breathtaking journey through cinema.</h2>
                  <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                    Our meticulously crafted algorithm weaves through millions of inter-connected themes, actors, and directors to serve you hand-picked recommendations that evoke awe and wonder in your movie-watching nights.
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {[
                      { icon: <Clapperboard className="text-gradient" />, text: "Stunning selections tailored for you" },
                      { icon: <Star className="text-gradient-warm" />, text: "Premium catalog of high-impact movies" },
                      { icon: <Layers className="text-gradient" />, text: "Curated experiences that transcend genres" }
                    ].map((feature, i) => (
                      <motion.li 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '1.1rem' }}
                      >
                        <div className="glass-panel" style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', display: 'flex' }}>
                          {feature.icon}
                        </div>
                        {feature.text}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '4/5' }}>
                    <div className="glass-panel" style={{ position: 'absolute', inset: 0, border: '1px solid rgba(167, 139, 250, 0.3)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem' }}>
                       <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
                          <PlayCircle size={80} color="rgba(255,255,255,0.1)" />
                       </motion.div>
                       <p style={{ color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Magic in Progress</p>
                    </div>
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'var(--color-primary-glow)', filter: 'blur(60px)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '200px', height: '200px', background: 'rgba(236,72,153,0.3)', filter: 'blur(60px)', borderRadius: '50%' }} />
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* User Spaces (Likes & Personal Recommendations) */}
        {!searchedMovie && (
          <div style={{ padding: '6rem 0' }}>
            {userSectionsLoading ? (
              <div className="text-center">
                <p>Curating your personal museum...</p>
              </div>
            ) : userSectionsError ? (
              <div className="text-center text-gradient-warm"><p>{userSectionsError}</p></div>
            ) : (
              <>
                {likedMovies.length > 0 ? (
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <MovieList movies={likedMovies} onMovieSelect={handleMovieSelect} heading="Your Collection" description="Films that have earned a permanent spot in your cosmic library." />
                  </motion.div>
                ) : (
                  <div className="text-center" style={{ padding: '4rem 0', color: 'var(--color-text-muted)' }}>
                    <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '1.2rem' }}>Your collection is empty. Start your journey by liking a movie.</p>
                  </div>
                )}

                {personalizedRecommendations.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ marginTop: '4rem' }}>
                    <MovieList 
                      movies={personalizedRecommendations} 
                      onMovieSelect={handleMovieSelect} 
                      heading={basedOnMovie ? `Because you savored ${basedOnMovie}` : "For You"}
                      description="An algorithmic masterpiece crafted from your tastes."
                    />
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Browse Sections (Trending, Genres) */}
      {!searchedMovie && (
        <div className="container" style={{ padding: '6rem 0', borderTop: '1px solid var(--color-border)' }}>
          {genreLoading ? (
            <div className="text-center">
              <p>Loading your explore feed...</p>
            </div>
          ) : genreError ? (
            <div className="text-center text-gradient-warm"><p>{genreError}</p></div>
          ) : (
            <>
              {/* Trending Section */}
              {trendingMovies.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  whileInView={{ opacity: 1 }} 
                  viewport={{ once: true }}
                  style={{ marginBottom: '6rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', paddingLeft: '20px' }}>
                    <Flame size={24} className="text-gradient-warm" />
                    <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: 0 }}>Trending Now</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '20px', paddingRight: '20px' }}>
                    <button 
                      onClick={() => scrollContainer(trendingScrollRef, "left")}
                      style={{
                        background: 'rgba(167, 139, 250, 0.2)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-primary)',
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--border-radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.4)'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.2)'; }}
                    >
                      ←
                    </button>
                    
                    <div 
                      ref={trendingScrollRef}
                      style={{ 
                        display: 'flex', 
                        gap: '1.5rem', 
                        minWidth: 'min-content',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        paddingBottom: '10px',
                        scrollBehavior: 'smooth',
                        flex: 1,
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                      }}
                      className="scroll-hide"
                    >
                      {trendingMovies.map((movie, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, y: 20 }} 
                          whileInView={{ opacity: 1, y: 0 }} 
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleMovieSelect(movie)}
                          style={{ 
                            minWidth: '200px', 
                            cursor: 'pointer',
                            flex: '0 0 auto'
                          }}
                          whileHover={{ scale: 1.05, y: -10 }}
                        >
                          <div style={{ 
                            position: 'relative', 
                            height: '300px', 
                            borderRadius: 'var(--border-radius-md)',
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(236,72,153,0.1))',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {movie.poster ? (
                              <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <PlayCircle size={48} opacity={0.3} />
                            )}
                            <div style={{ 
                              position: 'absolute', 
                              inset: 0, 
                              background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8))',
                              display: 'flex',
                              alignItems: 'flex-end',
                              padding: '1rem'
                            }}>
                              <div>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 0.5rem 0' }}>🔥 {movie.likes_count} Likes</p>
                                <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{movie.title}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <button 
                      onClick={() => scrollContainer(trendingScrollRef, "right")}
                      style={{
                        background: 'rgba(167, 139, 250, 0.2)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-primary)',
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--border-radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.4)'; }}
                      onMouseLeave={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.2)'; }}
                    >
                      →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Genre Sections */}
              {[
                { genre: 'Action', movies: actionMovies, icon: '🎯', ref: actionScrollRef },
                { genre: 'Comedy', movies: comedyMovies, icon: '😂', ref: comedyScrollRef },
                { genre: 'Drama', movies: dramaMovies, icon: '🎬', ref: dramaScrollRef }
              ].map((section, sectionIdx) => (
                trendingMovies.length > 0 || section.movies.length > 0 ? (
                  <motion.div 
                    key={section.genre}
                    initial={{ opacity: 0 }} 
                    whileInView={{ opacity: 1 }} 
                    viewport={{ once: true }}
                    style={{ marginBottom: '6rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', paddingLeft: '20px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
                      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: 0 }}>{section.genre} Movies</h2>
                    </div>
                    {section.movies.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '20px', paddingRight: '20px' }}>
                        <button 
                          onClick={() => scrollContainer(section.ref, "left")}
                          style={{
                            background: 'rgba(167, 139, 250, 0.2)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--border-radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.4)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.2)'; }}
                        >
                          ←
                        </button>

                        <div 
                          ref={section.ref}
                          style={{ 
                            display: 'flex', 
                            gap: '1.5rem', 
                            minWidth: 'min-content',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            paddingBottom: '10px',
                            scrollBehavior: 'smooth',
                            flex: 1,
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                          }}
                          className="scroll-hide"
                        >
                          {section.movies.slice(0, 12).map((movie, idx) => (
                            <motion.div 
                              key={idx} 
                              initial={{ opacity: 0, y: 20 }} 
                              whileInView={{ opacity: 1, y: 0 }} 
                              viewport={{ once: true }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => handleMovieSelect(movie)}
                              style={{ 
                                minWidth: '180px', 
                                cursor: 'pointer',
                                flex: '0 0 auto'
                              }}
                              whileHover={{ scale: 1.05, y: -10 }}
                            >
                              <div style={{ 
                                position: 'relative', 
                                height: '270px', 
                                borderRadius: 'var(--border-radius-md)',
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(236,72,153,0.1))',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {movie.poster ? (
                                  <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <PlayCircle size={40} opacity={0.3} />
                                )}
                                <div style={{ 
                                  position: 'absolute', 
                                  inset: 0, 
                                  background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8))',
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  padding: '1rem'
                                }}>
                                  <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{movie.title}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <button 
                          onClick={() => scrollContainer(section.ref, "right")}
                          style={{
                            background: 'rgba(167, 139, 250, 0.2)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--border-radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.4)'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'rgba(167, 139, 250, 0.2)'; }}
                        >
                          →
                        </button>
                      </div>
                    ) : (
                      <div className="text-center" style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
                        <p>No {section.genre.toLowerCase()} movies available.</p>
                      </div>
                    )}
                  </motion.div>
                ) : null
              ))}
            </>
          )}
        </div>
      )}
      
      {/* Footer */}
      <footer style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid var(--color-border)', padding: '4rem 0 2rem' }}>
         <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Film className="text-gradient-warm" size={24} /> Cinemagic
            </span>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Crafting cozy, unforgettable cinematic journeys. Designed with passion for the dreamers and the creators.</p>
            <div style={{ display: 'flex', gap: '2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
               <span>Privacy</span>
               <span>Terms</span>
               <span>Cinematic Universe</span>
            </div>
            <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              © {new Date().getFullYear()} Cinemagic Pro. All rights reserved.
            </div>
         </div>
      </footer>

      <MovieModal
        movie={selectedMovie}
        isOpen={showModal}
        onClose={handleCloseModal}
        onLike={handleLikeMovie}
        liking={likeLoading}
        likeMessage={likeMessage}
        isLiked={selectedMovie ? likedMovieKeys.includes(getMovieKey(selectedMovie)) : false}
      />
    </div>
  );
}

export default HomePage;
