import { useParams } from "react-router-dom";
import "./Meeting.scss";

/**
 * Meeting page component.
 * Shows the base layout for the video area and chat sidebar without real-time functionality.
 */
const Meeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const meetingUrl = window.location.href;

  return (
    <div className="meeting app-content">
      <header className="meeting__header">
        <div>
          <h1>Reunión</h1>
          <p className="meeting__info">
            ID de la reunión: <span className="meeting__id">{id}</span>
          </p>
          <p className="meeting__info">
            Comparte este enlace con tu equipo para que puedan unirse:
            <span className="meeting__link">{meetingUrl}</span>
          </p>
        </div>
      </header>

      <section
        className="meeting__layout"
        aria-label="Interfaz de sala de videoconferencia"
      >
        {/* Área de video (mock / sin funcionalidad) */}
        <div className="meeting__video-area" aria-label="Área de video">
          <div className="meeting__video-grid">
            <div className="meeting__video-tile meeting__video-tile--main">
              <span className="meeting__video-label">
                Aquí se mostrará el video principal de la reunión.
              </span>
            </div>
            <div className="meeting__video-tile">
              <span className="meeting__video-label">Participante 1</span>
            </div>
            <div className="meeting__video-tile">
              <span className="meeting__video-label">Participante 2</span>
            </div>
            <div className="meeting__video-tile">
              <span className="meeting__video-label">Participante 3</span>
            </div>
          </div>
          <p className="meeting__hint">
            Nota: el video en tiempo real se implementará en los próximos
            sprints. Esta vista solo representa el diseño de la sala.
          </p>
        </div>

        {/* Panel de chat (mock / sin funcionalidad) */}
        <aside
          className="meeting__chat-area"
          aria-label="Panel de chat de la reunión"
        >
          <h2 className="meeting__chat-title">Chat de la reunión</h2>

          <div className="meeting__chat-messages">
            <div className="meeting__chat-message meeting__chat-message--info">
              <span className="meeting__chat-meta">Sistema</span>
              <p className="meeting__chat-text">
                El chat en tiempo real se agregará en el Sprint 2. Por ahora
                esta sección solo muestra el diseño de la interfaz.
              </p>
            </div>

            
          </div>

          <form className="meeting__chat-input" aria-disabled="true">
            <label
              htmlFor="chat-input-disabled"
              className="meeting__chat-label"
            >
              Enviar mensaje
            </label>
            <input
              id="chat-input-disabled"
              type="text"
              disabled
              placeholder="El chat estará disponible próximamente."
            />
            <button type="button" disabled>
              Enviar
            </button>
          </form>

          <p className="meeting__hint">
            Esta sección muestra cómo será la experiencia de chat, pero todavía
            no envía ni recibe mensajes.
          </p>
        </aside>
      </section>
    </div>
  );
};

export default Meeting;
