import "./Home.scss";
import { useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
=======
import { useState, useEffect } from "react";
import { auth } from "../../config/firebase";
>>>>>>> Stashed changes

/**
 * Home page component.
 * Shows the main hero, key features and a simple visual site map.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();

<<<<<<< Updated upstream
  const handleScrollToFeatures = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
=======
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

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    /**
     * Using code as meetingId.
     */
    navigate(`/meeting/${trimmed}`);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            <button
              className="btn btn--primary"
              onClick={() => navigate("/create")}
            >
              Crear reunión
            </button>
            <button
              className="btn btn--ghost"
              onClick={handleScrollToFeatures}
            >
              Ver funcionalidades
            </button>
          </div>
=======
            {isAuthenticated && (
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
            )}
          </div>

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
>>>>>>> Stashed changes
        </div>

        <div className="home__hero-illustration">
          <div className="home__mockup">
            <img src="/video-conferencia.png" alt="Video conferencia" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1.5rem'}} />
          </div>
        </div>
      </section>

      <section id="features" className="home__features">
        <h2>Funcionalidades</h2>
        <div className="home__features-grid">
          <article className="home__feature-card">
            <h3>Creación rápida de reuniones</h3>
            <p>
              Genera un ID de sala único en segundos y comparte el enlace con tu
              equipo.
            </p>
          </article>
          <article className="home__feature-card">
            <h3>Navegación clara</h3>
            <p>
              Un menú simple y un mapa del sitio ayudan a entender en qué parte
              de la plataforma estás.
            </p>
            <ul style={{marginTop: '1rem'}}>
              <li><a href="/">Inicio</a></li>
              <li><a href="/about">Sobre nosotros</a></li>
              {isAuthenticated && <li><a href="/edit-profile">Editar perfil</a></li>}
              {isAuthenticated && <li><a href="/create">Crear reunión</a></li>}
              {isAuthenticated && <li><a href="#" onClick={() => setShowJoinForm(true)}>Unirse a una reunión</a></li>}
              {!isAuthenticated && <li><a href="/login">Iniciar sesión</a></li>}
              {!isAuthenticated && <li><a href="/register">Registro</a></li>}
            </ul>
          </article>
          <article className="home__feature-card">
            <h3>Lista para crecer</h3>
            <p>
              Diseñada para soportar chat, audio y video en tiempo real en los
              siguientes sprints.
            </p>
          </article>
        </div>
      </section>

      {/* Mapa del sitio en la página de inicio 
      <section
        className="home__sitemap"
        aria-labelledby="home-sitemap-title"
      >
       <h2 id="home-sitemap-title">Mapa del sitio</h2>

        <div className="home__sitemap-grid">
          <div className="home__sitemap-column">
           
            <ul className="home__sitemap-list">
              <li>
                <Link to="/" className="home__sitemap-link">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/about" className="home__sitemap-link">
                  Sobre nosotros 
                </Link>
              </li>
              <li>
                <Link to="/create" className="home__sitemap-link">
                  Crear reunión 
                </Link>
              </li>
              {/* Si más adelante tienen Login / Profile / Help, se agregan aquí 
            </ul>
          </div> 

          
        </div>
      </section> */}
    </div>
  );
};

export default Home;
