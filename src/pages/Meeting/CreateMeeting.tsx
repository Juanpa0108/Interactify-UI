import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateMeeting.scss";

/**
 * CreateMeeting page component.
 * Generates a unique meeting ID and tries to persist it in the backend.
 * If the server fails (404, 500, network error, etc.), falls back to a local ID
 * so the user can igualmente usar la sala.
 */
const CreateMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopiedLink, setShowCopiedLink] = useState(false);
  const [showCopiedCode, setShowCopiedCode] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Construimos la URL base limpia (sin barra al final)
    const base =
      (import.meta.env.VITE_API_BASE_URL as string) ||
      (import.meta.env.VITE_API_URL as string) ||
      "";
    const baseUrl = base.replace(/\/+$/, "");

    // IMPORTANTE:
    // Tu router de reuniones está montado como `router.post('/')`,
    // y normalmente se monta en el servidor como app.use('/meetings', router).
    // Por eso aquí usamos `/meetings` (sin `/api`).
    // Si en tu app.ts realmente usas app.use('/api/meetings', router),
    // cambia la línea de abajo a: `${baseUrl}/api/meetings`
    const endpoint = `${baseUrl}/api/meetings`;
    console.log("Creando reunión en:", endpoint);

    const generateLocalId = () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 10);

    setIsRedirecting(true);

    (async () => {
      try {
        if (!baseUrl) {
          console.warn(
            "[CreateMeeting] No API base URL configured, usando ID local."
          );
          const localId = generateLocalId();
          setCreatedMeetingId(localId);
          setErrorMessage(
            "La reunión se creó solo en el cliente (no hay API configurada)."
          );
          return;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: "Reunión rápida" }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.warn(
            `[CreateMeeting] Error creando reunión en el servidor (${res.status}):`,
            txt
          );
          setErrorMessage(
            `El servidor respondió con estado ${res.status}. Se usará un ID local.`
          );
          const fallbackId = generateLocalId();
          setCreatedMeetingId(fallbackId);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const idFromServer = data?.meetingId ?? data?.meeting?.id ?? null;

        if (idFromServer) {
          setCreatedMeetingId(idFromServer);
        } else {
          console.warn(
            "[CreateMeeting] Respuesta del servidor sin ID claro, usando ID local.",
            data
          );
          const fallbackId = generateLocalId();
          setCreatedMeetingId(fallbackId);
          setErrorMessage(
            "La reunión se creó, pero el servidor no devolvió un ID claro. Se usa un ID local."
          );
        }
      } catch (err) {
        console.error("[CreateMeeting] Error creando reunión en el servidor:", err);
        setErrorMessage(
          "No se pudo guardar la reunión en el servidor. Se usará un ID local."
        );
        const fallbackId = generateLocalId();
        setCreatedMeetingId(fallbackId);
      } finally {
        setIsRedirecting(false);
      }
    })();
  }, [navigate]);

  const inviteUrl = createdMeetingId
    ? `${window.location.origin}/meeting/${createdMeetingId}`
    : "";

  const handleCopy = async (value: string, type: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(value);
      if (type === "link") {
        setShowCopiedLink(true);
        setTimeout(() => setShowCopiedLink(false), 1800);
      } else {
        setShowCopiedCode(true);
        setTimeout(() => setShowCopiedCode(false), 1800);
      }
    } catch {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  };

  return (
    <div className="create-meeting app-content">
      <div className="create-meeting__card">
        <h1>Creando tu reunión…</h1>
        <p className="create-meeting__text">
          Estamos generando un ID único para la sala y preparando el enlace de invitación.
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

            <p className="create-meeting__code">
              Código de reunión: <span>{createdMeetingId}</span>
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
                  onClick={() => handleCopy(inviteUrl, "link")}
                >
                  Copiar link
                </button>

                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() =>
                    handleCopy(createdMeetingId ?? "", "code")
                  }
                >
                  Copiar código
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

            {showCopiedLink && (
              <div className="toast">Link copiado al portapapeles</div>
            )}
            {showCopiedCode && (
              <div className="toast">Código copiado al portapapeles</div>
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
