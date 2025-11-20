import { Link, NavLink } from "react-router-dom";
import "./Navbar.scss";

/**
 * Main navigation bar.
 * Provides access to the key sections of the Interactify platform.
 */
const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <div className="navbar__inner app-content">
        <Link to="/" className="navbar__logo">
          <span className="navbar__brand">Interactify</span>
        </Link>

        <nav
          className="navbar__nav"
          aria-label="Navegación principal"
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
            end
          >
            Inicio
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
          >
            Sobre nosotros
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
