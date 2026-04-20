import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Film } from "lucide-react";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <motion.header 
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand">
          <Film className="navbar__icon text-gradient-warm" size={28} />
          Cinemagic
          <span>Pro</span>
        </NavLink>

        <nav className="navbar__links" aria-label="Main navigation">
          {user ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                Discover
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  isActive ? "navbar__link navbar__link--active" : "navbar__link"
                }
              >
                About
              </NavLink>
              
              <span className="navbar__user" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                {user}
              </span>
              <button className="btn" type="button" onClick={handleLogout} style={{ padding: '0.5rem 1.25rem' }}>
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "navbar__link navbar__link--active" : "btn btn--primary"
              }
            >
              Sign In
            </NavLink>
          )}
        </nav>
      </div>
    </motion.header>
  );
}

export default Navbar;
