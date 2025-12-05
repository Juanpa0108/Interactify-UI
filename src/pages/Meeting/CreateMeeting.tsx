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
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    /**
     * Verify if the user is authenticated (API token)
     */
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    setIsRedirecting(true);

    (async () => {
      try {
        const apiUrl = (import.meta.env.VITE_API_URL as string) || "";
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
          setErrorMessage(`El servidor respondió con estado ${res.status}. Se usará un ID local.`);
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
              Comparte este enlace con tu equipo para que puedan unirse a la
              reunión.
            </p>

            <div className="meeting-link-row">
              <label className="create-meeting__label">
                Enlace de invitación
                <input
                  readOnly
                  value={inviteUrl}
                  aria-label="Enlace de invitación a la reunión"
                />
              </label>

              <div className="create-meeting__actions">
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inviteUrl);
                      setShowCopied(true);
                      setTimeout(() => setShowCopied(false), 1800);
                    } catch (err) {
                      (document.activeElement as HTMLElement)?.blur();
                    }
                  }}
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

            {showCopied && (
              <div className="toast">Link copiado al portapapeles</div>
            )}
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
