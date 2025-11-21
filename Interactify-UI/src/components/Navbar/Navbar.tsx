import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.scss";
import { useEffect, useState } from "react";

/**
 * Main navigation bar.
 *
 * Responsibilities:
 * - Display brand and primary navigation links.
 * - Show different actions depending on authentication state (login vs
 *   profile + logout).
 * - Listen for Firebase auth state changes to keep the UI in sync with
 *   the authentication status.
 */
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check localStorage as a quick heuristic (may be stale). The
    // authoritative source is Firebase's onAuthStateChanged below.
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    // Subscribe to Firebase auth updates. This keeps the navbar reactive
    // to login/logout events from other tabs or asynchronous flows.
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

          {isAuthenticated ? (
            <>
              <NavLink
                to="/edit-profile"
          {/* Mostrar las opciones de login y registro solo si el usuario no está autenticado */}
          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
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
                Sign out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
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
              Sign in
              Editar perfil
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
