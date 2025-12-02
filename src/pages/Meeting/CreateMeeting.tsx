import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateMeeting.scss";

/**
 * CreateMeeting page component.
 * Generates a unique meeting ID and redirects the user to the meeting room.
 * Calls the backend when possible and falls back to a local ID for UX.
 */
const CreateMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    // Comprobamos si el usuario está autenticado (token de la API)
    const storedToken =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!storedToken) {
      navigate("/login");
      return;
    }

    setIsRedirecting(true);

    (async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL as string) || "";
        // Preferimos token fresco de Firebase Auth por si el de localStorage expiró
        let token = storedToken;
        try {
          const { auth } = await import("../../config/firebase");
          if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          }
        } catch {}
        const res = await fetch(`${apiUrl}/api/meetings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: "Reunión rápida" }),
        });

        if (!res.ok) {
          const txt = await res.text();
          console.warn(
            "Error creating meeting on server, falling back to client-only:",
            txt
          );
          setErrorMessage(
            `El servidor respondió con estado ${res.status}. Se usará un ID local.`
          );
          const fallbackId =
            typeof crypto !== "undefined" && (crypto as any).randomUUID
              ? (crypto as any).randomUUID()
              : Math.random().toString(36).substring(2, 10);
          setCreatedMeetingId(fallbackId);
        } else {
          const data = await res.json();
          const idFromServer = data?.meetingId ?? data?.meeting?.id ?? null;
          if (idFromServer) {
            setCreatedMeetingId(idFromServer);
          } else {
            const fallbackId =
              typeof crypto !== "undefined" && (crypto as any).randomUUID
                ? (crypto as any).randomUUID()
                : Math.random().toString(36).substring(2, 10);
            setCreatedMeetingId(fallbackId);
          }
        }
      } catch (err) {
        console.error("Failed to persist meeting:", err);
        setErrorMessage(
          "No se pudo guardar la reunión en el servidor. Se usará un ID local."
        );
        const fallbackId =
          typeof crypto !== "undefined" && (crypto as any).randomUUID
            ? (crypto as any).randomUUID()
            : Math.random().toString(36).substring(2, 10);
        setCreatedMeetingId(fallbackId);
      } finally {
        setIsRedirecting(false);
      }
    })();
  }, [navigate]);

  const inviteUrl = createdMeetingId
    ? `${window.location.origin}/meeting/${createdMeetingId}`
    : "";

  const handleCopy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(message);
      setTimeout(() => setCopyMessage(null), 1800);
    } catch (err) {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  return (
    <div className="create-meeting app-content">
      <div className="create-meeting__card">
        <h1>Creando tu reunión…</h1>
        <p className="create-meeting__text">
          Estamos generando un ID único para la sala y preparando el enlace de
          invitación.
        </p>

        {isRedirecting && (
          <p className="create-meeting__status">Creando reunión…</p>
        )}

        {createdMeetingId && (
          <div className="create-meeting__result">
            <h2 className="create-meeting__subtitle">Tu reunión está lista</h2>
            <p className="create-meeting__hint">
              Comparte este enlace o el código de la reunión con tu equipo.
            </p>

            {/* Código de reunión visible y copiables */}
            <p className="create-meeting__code">
              Código de reunión: <span>{createdMeetingId}</span>
            </p>

            <div className="create-meeting__actions create-meeting__actions--code">
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() =>
                  handleCopy(
                    createdMeetingId,
                    "Código copiado al portapapeles"
                  )
                }
              >
                Copiar código
              </button>
            </div>

            <div className="meeting-link-row">
              <label className="create-meeting__label">
                Enlace de invitación
                <input
                  readOnly
                  value={inviteUrl}
                  aria-label="Enlace de invitación a la reunión"
                />
              </label>

              <div className="create-meeting__actions create-meeting__actions--link">
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() =>
                    handleCopy(inviteUrl, "Link copiado al portapapeles")
                  }
                >
                  Copiar link
                </button>

                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() =>
                    navigate(`/meeting/${createdMeetingId}`, { replace: true })
                  }
                >
                  Ir a la reunión
                </button>
              </div>
            </div>

            {copyMessage && <div className="toast">{copyMessage}</div>}
            {errorMessage && (
              <p className="error">Advertencia: {errorMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMeeting;
