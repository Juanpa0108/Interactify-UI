import "./Home.scss";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../../config/firebase";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const current = auth.currentUser;
    if (current) {
      setIsAuthenticated(true);
      return;
    }
    const unsub = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsub();
  }, []);

  const handleScrollToFeatures = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    navigate(`/meeting/${trimmed}`);
  };

  return (
    <div className="home app-content">
      <section className="home__hero">
        <div className="home__hero-text">
          <h1>Videollamadas simples, claras y en tiempo real.</h1>

          <p>
            Interactify es una plataforma web para crear reuniones rápidas,
            conectar equipos de 2 a 10 personas y preparar la base para el chat,
            el audio y el video en tiempo real.
          </p>

          <div className="home__hero-actions">
            {isAuthenticated ? (
              <>
                <button
                  className="btn btn--primary"
                  onClick={() => navigate("/create")}
                >
                  Crear reunión
                </button>

                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => setShowJoinForm((prev) => !prev)}
                >
                  Unirse a una reunión
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn--primary"
                  onClick={() => navigate("/login")}
                >
                  Comenzar ahora
                </button>

                <button
                  className="btn btn--ghost"
                  onClick={handleScrollToFeatures}
                >
                  Ver funcionalidades
                </button>
              </>
            )}
          </div>

          {/* FORMULARIO DE UNIRSE */}
          {isAuthenticated && showJoinForm && (
            <form
              className="home__join-form"
              onSubmit={handleJoinSubmit}
              aria-label="Unirse a una reunión mediante código"
            >
              <label className="home__join-label">
                Código de reunión
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Ej: 2f9c8a1b..."
                  aria-label="Código de reunión"
                />
              </label>

              <button className="btn btn--secondary" type="submit">
                Unirse
              </button>
            </form>
          )}
        </div>

        <div className="home__hero-illustration">
          <div className="home__mockup">
            <img
              src="/video-conferencia.png"
              alt="Video conferencia"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
       <section id="features" className="home__features">
        <h2>Funcionalidades</h2>

        <div className="home__features-grid">
          <article className="home__feature-card">
            <h3>Creación rápida de reuniones</h3>
            <p>
              Crea una sala en segundos y genera automáticamente un enlace y un
              código para compartir con tu equipo.
            </p>
          </article>

          <article className="home__feature-card">
            <h3>Navegación clara</h3>
            <p>
              Un menú simple y un mapa del sitio ayudan a entender en qué parte
              de la plataforma estás.
            </p>

            <ul className="home__feature-list">
              <li><a href="/">Inicio</a></li>
              <li><a href="/about">Sobre nosotros</a></li>

              {isAuthenticated ? (
                <>
                  <li><a href="/edit-profile">Editar perfil</a></li>
                  <li><a href="/create">Crear reunión</a></li>
                  <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowJoinForm(true); }}>
                      Unirse a una reunión
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li><a href="/login">Iniciar sesión</a></li>
                  <li><a href="/register">Registro</a></li>
                </>
              )}
            </ul>
          </article>

          <article className="home__feature-card">
            <h3>Lista para crecer</h3>
            <p>
              La sala de reunión ya incluye chat y controles básicos y está
              preparada para sumar audio y video en los siguientes sprints.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Home;
