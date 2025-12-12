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

  // Prevenir scroll cuando el menú móvil está abierto + cerrar con Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    } else {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
    closeMobileMenu();
    const code = window.prompt("Ingresa el código de la reunión:");
    if (!code) return;

    const trimmed = code.trim();
    if (!trimmed) return;

    navigate(`/meeting/${trimmed}`);
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" onClick={closeMobileMenu}>
          <span className="navbar__brand">Interactify</span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          className={`navbar__hamburger ${
            isMobileMenuOpen ? "navbar__hamburger--open" : ""
          }`}
          type="button"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-label="Abrir/cerrar menú"
          aria-expanded={isMobileMenuOpen}
          aria-controls="primary-navigation"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Navegación desktop y móvil */}
        <nav
          id="primary-navigation"
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

        {/* Overlay */}
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
