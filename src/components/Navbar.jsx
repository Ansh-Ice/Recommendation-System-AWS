import { NavLink, useNavigate } from "react-router-dom";
import { clearStoredUserId, getStoredUserId } from "../services/api";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
];

function Navbar() {
  const navigate = useNavigate();
  const userId = getStoredUserId();

  const handleLogout = () => {
    clearStoredUserId();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand">
          Movie Recommender
        </NavLink>

        <nav className="navbar__links" aria-label="Main navigation">
          {userId
            ? links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    isActive ? "navbar__link navbar__link--active" : "navbar__link"
                  }
                >
                  {link.label}
                </NavLink>
              ))
            : null}

          {userId ? <span className="navbar__user">{userId}</span> : null}

          {userId ? (
            <button className="navbar__logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? "navbar__link navbar__link--active" : "navbar__link"
              }
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
