import "./Home.scss";
import { useNavigate } from "react-router-dom";

/**
 * Home page component.
 * Shows the main hero, key features and a simple visual site map.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleScrollToFeatures = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
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
              type="button"
              onClick={() => setShowJoinForm((prev) => !prev)}
            >
              Unirse a una reunión
            </button>
          </div>
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
    </div>
  );
};

export default Home;
