import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";
import "./Navbar.scss";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    setIsAuthenticated(!!token);

    const unsub = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsub();
  }, []);

  // Prevenir scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("signOut failed", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
    navigate("/login");
  };

  const handleJoinMeeting = () => {
    setIsMobileMenuOpen(false);
    const code = window.prompt("Ingresa el código de la reunión:");
    if (!code) return;

    const trimmed = code.trim();
    if (!trimmed) return;

    navigate(`/meeting/${trimmed}`);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar__inner app-content">
        <Link to="/" className="navbar__logo" onClick={closeMobileMenu}>
          <span className="navbar__brand">Interactify</span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          className={`navbar__hamburger ${isMobileMenuOpen ? "navbar__hamburger--open" : ""}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navegación desktop y móvil */}
        <nav
          className={`navbar__nav ${isMobileMenuOpen ? "navbar__nav--open" : ""}`}
          aria-label="Navegación principal"
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
            onClick={closeMobileMenu}
            end
          >
            Inicio
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "navbar__link--active" : ""}`
            }
            onClick={closeMobileMenu}
          >
            Sobre nosotros
          </NavLink>

          <button
            type="button"
            className="navbar__link"
            onClick={handleJoinMeeting}
          >
            Unirse a una reunión
          </button>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/create"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Crear reunión
              </NavLink>
              <NavLink
                to="/edit-profile"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Perfil
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar__link navbar__link--logout"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={closeMobileMenu}
              >
                Registro
              </NavLink>
            </>
          )}
        </nav>

        {/* Overlay para cerrar el menú al hacer clic fuera */}
        {isMobileMenuOpen && (
          <div
            className="navbar__overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;