import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.scss";

/**
 * Main navigation bar.
 * Provides access to the key sections of the Interactify platform.
 */
const Navbar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si el token de autenticación existe en el localStorage
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token); // Si hay un token, el usuario está autenticado
  }, []);

  return (
    <header className="navbar">
      <div className="navbar__inner app-content">
        <Link to="/" className="navbar__logo">
          <span className="navbar__brand">Interactify</span>
        </Link>

        <nav className="navbar__nav" aria-label="Navegación principal">
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

          {/* Mostrar las opciones de login y registro solo si el usuario no está autenticado */}
          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
              >
                Iniciar sesión
              </NavLink>
            </>
          )}

          {/* Mostrar el enlace de "Crear reunión" solo si el usuario está autenticado */}
          {isAuthenticated && (
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `navbar__link ${isActive ? "navbar__link--active" : ""}`
              }
            >
              Crear reunión
            </NavLink>
          )}

          {/* Mostrar el enlace de "Editar perfil" solo si el usuario está autenticado */}
          {isAuthenticated && (
            <NavLink
              to="/edit-profile"
              className={({ isActive }) =>
                `navbar__link ${isActive ? "navbar__link--active" : ""}`
              }
            >
              Editar perfil
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
