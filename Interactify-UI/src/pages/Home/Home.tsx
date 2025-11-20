import "./Home.scss";
import { Link, useNavigate } from "react-router-dom";

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
        </div>

        <div className="home__hero-illustration">
          {/* Reemplazar por la ilustración real del Figma */}
          <div className="home__mockup">Vista previa de Interactify</div>
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

      {/* Mapa del sitio en la página de inicio */}
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
              {/* Si más adelante tienen Login / Profile / Help, se agregan aquí */}
            </ul>
          </div>

          
        </div>
      </section>
    </div>
  );
};

export default Home;
