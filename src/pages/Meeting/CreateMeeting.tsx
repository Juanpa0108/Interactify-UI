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
    const storedToken =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!storedToken) {
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
        const apiUrl = (import.meta.env.VITE_API_URL as string) || "";
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
        <div className="create-meeting__header">
          <div className="create-meeting__icon">🎥</div>
          <h1>Creando tu reunión</h1>
        </div>

        <p className="create-meeting__description">
          Estamos generando un ID único para la sala y preparando el enlace de
          invitación.
        </p>

        {isRedirecting && (
          <div className="create-meeting__loading">
            <div className="create-spinner"></div>
            <p>Configurando tu sala...</p>
          </div>
        )}

        {errorMessage && (
          <div className="create-meeting__error">
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <p>{errorMessage}</p>
              <button
                className="create-btn create-btn--ghost"
                type="button"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {createdMeetingId && (
          <div className="create-meeting__success">
            <div className="success-badge">
              <span className="success-icon">✓</span>
              <span>Reunión lista</span>
            </div>

            <p className="create-meeting__hint">
              Comparte este código o enlace con tu equipo para que se unan
            </p>

            {/* Código de reunión */}
            <div className="create-meeting__code-section">
              <label className="create-meeting__label">
                <span className="label-icon">🔑</span>
                Código de reunión
              </label>
              <div className="create-meeting__code-box">
                <code className="meeting-code">{createdMeetingId}</code>
                <button
                  className="create-btn create-btn--copy"
                  type="button"
                  onClick={() =>
                    handleCopy(
                      createdMeetingId,
                      "code"
                    )
                  }
                  title="Copiar código"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Enlace de invitación */}
            <div className="create-meeting__link-section">
              <label className="create-meeting__label">
                <span className="label-icon">🔗</span>
                Enlace de invitación
              </label>
              <div className="create-meeting__input-group">
                <input
                  readOnly
                  value={inviteUrl}
                  aria-label="Enlace de invitación a la reunión"
                  className="create-meeting__input"
                />
                <button
                  className="create-btn create-btn--copy"
                  type="button"
                  onClick={() => handleCopy(inviteUrl, "link")}
                  title="Copiar enlace"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Acción principal */}
            <button
              className="create-btn create-btn--primary"
              type="button"
              disabled={!createdMeetingId}
              onClick={() => createdMeetingId &&
                navigate(`/meeting/${createdMeetingId}`, { replace: true })
              }
            >
              Entrar a la reunión →
            </button>

            {showCopiedLink && (
              <div className="create-toast">
                ✓ Enlace copiado
              </div>
            )}
            {showCopiedCode && (
              <div className="create-toast">
                ✓ Código copiado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateMeeting;