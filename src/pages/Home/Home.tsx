import "./Home.scss";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

/**
 * Home page component.
 * Shows the main hero, key features and a simple visual site map.
 */
const Home: React.FC = () => {
  const navigate = useNavigate();

  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCode.trim();
    if (!trimmed) return;
    // Usamos el código como meetingId
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

          {showJoinForm && (
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
    </div>
  );
};

export default Home;
