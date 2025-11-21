import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateMeeting.scss";

/**
 * CreateMeeting page component.
 * Generates a unique meeting ID and redirects the user to the meeting room.
 * Implements system status visibility by showing a short loading state.
 */
const CreateMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Comprobamos si el usuario está autenticado
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Si no está autenticado, redirigimos a login
      navigate("/login");
      return;
    }

    setIsRedirecting(true);

    // Generación de ID único para la reunión
    const meetingId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 10);

    // Timeout para mostrar el estado de carga antes de redirigir (opcional)
    const timer = setTimeout(() => {
      navigate(`/meeting/${meetingId}`, { replace: true });
    }, 700);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="create-meeting app-content">
      <div className="create-meeting__card">
        <h1>Creando tu reunión…</h1>
        <p className="create-meeting__text">
          Estamos generando un ID único para la sala y redirigiéndote a la
          reunión.
        </p>
        {isRedirecting && (
          <p className="create-meeting__status">
            Por favor espera un momento…
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateMeeting;
