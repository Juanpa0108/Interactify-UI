import { useNavigate, useParams } from "react-router-dom";
import "./Meeting.scss";
import Chat from "../../components/Chat/Chat";

/**
 * Meeting page component.
 * Shows the base layout for the video area and chat sidebar with real chat component.
 */
const Meeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const meetingUrl = window.location.href;

  const handleLeaveMeeting = () => {
  /**
   * Here you can clean up additional state if needed (close sockets, etc.)
  */
    navigate("/", { replace: true });
  };

  return (
    <div className="meeting app-content">
      <header className="meeting__header">
        <div className="meeting__header-left">
          <h1>Reunión</h1>
          <p className="meeting__info">
            ID de la reunión: <span className="meeting__id">{id}</span>
          </p>
          <p className="meeting__info">
            Comparte este enlace con tu equipo para que puedan unirse:
            <span className="meeting__link">{meetingUrl}</span>
          </p>
        </div>

        <div className="meeting__header-actions">
          <button
            type="button"
            className="btn btn--ghost meeting__leave-btn"
            onClick={handleLeaveMeeting}
          >
            Salir de la reunión
          </button>
        </div>
      </header>

      <section
        className="meeting__layout"
        aria-label="Interfaz de sala de videoconferencia"
      >
        {/* video area (mock / no functionality) */}
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

        {/* Chat panel: real component */}
        <aside
          className="meeting__chat-area"
          aria-label="Panel de chat de la reunión"
        >
          <h2 className="meeting__chat-title">Chat de la reunión</h2>
          <Chat />
        </aside>
      </section>
    </div>
  );
};

export default Meeting;
