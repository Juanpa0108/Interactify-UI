import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import "./Navbar.scss";
import { useEffect, useState } from "react";

/**
 * Main navigation bar.
 * Provides access to the key sections of the Interactify platform.
 */
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Escuchar cambios en el estado de autenticación
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

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

          {isAuthenticated ? (
            <>
              <NavLink
                to="/edit-profile"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
              >
                Perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="navbar__link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `navbar__link ${isActive ? "navbar__link--active" : ""}`
              }
            >
              Iniciar sesión
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
