import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./Meeting.scss";
import Chat from "../../components/Chat/Chat";
import socketService from "../../services/socket";
import { auth } from "../../config/firebase";

/**
 * Meeting page component.
 * Shows the base layout for the video area and chat sidebar with real chat component.
 */
const Meeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const meetingUrl = window.location.href;

  const [participants, setParticipants] = useState<string[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Try to get a fresh idToken from firebase auth, fallback to localStorage
        let idToken: string | null = null;
        const current = auth.currentUser;
        if (current) {
          idToken = await current.getIdToken();
        } else {
          idToken = localStorage.getItem('token');
        }

        if (idToken) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${API_URL}/api/user/profile`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            const name = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.displayName || data.email || '';
            if (mounted && name) setProfileName(name);
            // merge into localStorage.user for later use
            try {
              const raw = localStorage.getItem('user');
              const parsed = raw ? JSON.parse(raw) : {};
              const merged = { ...parsed, ...data };
              localStorage.setItem('user', JSON.stringify(merged));
            } catch (e) { /* ignore */ }
          } else {
            // fallback to localStorage
            const profileUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
            try {
              if (profileUserRaw) {
                const parsed = JSON.parse(profileUserRaw);
                const name = parsed?.firstName && parsed?.lastName ? `${parsed.firstName} ${parsed.lastName}` : parsed?.displayName || parsed?.email || '';
                if (mounted && name) setProfileName(name);
              }
            } catch (e) {
              if (mounted) setProfileName(profileUserRaw || '');
            }
          }
        }
      } catch (err) {
        // fallback to localStorage
        const profileUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        try {
          if (profileUserRaw) {
            const parsed = JSON.parse(profileUserRaw);
            const name = parsed?.firstName && parsed?.lastName ? `${parsed.firstName} ${parsed.lastName}` : parsed?.displayName || parsed?.email || '';
            if (mounted && name) setProfileName(name);
          }
        } catch (e) {
          if (mounted) setProfileName(profileUserRaw || '');
        }
      }

      const socket = socketService.connectSocket();

      socket.on('usersOnline', (users: any[]) => {
        const names = (users || []).map(u => (u?.userId || u?.name || u?.displayName || String(u))).slice(0, 10);
        if (mounted) setParticipants(names);
      });

      // Announce ourselves using profileName or fallback
      const announce = () => {
        if (!socket || !socket.emit) return;
        if (profileName) socket.emit('newUser', profileName);
        else {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          let fallback = '';
          try { if (raw) { const p = JSON.parse(raw); fallback = p?.displayName || p?.email || ''; } } catch (e) { fallback = raw || ''; }
          if (fallback) socket.emit('newUser', fallback);
        }
      };

      // Call announce once
      announce();

      return () => {
        mounted = false;
        const s = socketService.getSocket();
        if (s) s.off('usersOnline');
      };
    }

    void init();
  }, []);

<<<<<<< Updated upstream
  const handleLeaveMeeting = () => {
  /**
   * Here you can clean up additional state if needed (close sockets, etc.)
  */
=======
  const [participants, setParticipants] = useState<string[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        /**
         * Try to get a fresh idToken from Firebase Auth, fallback to localStorage.
         */
        let idToken: string | null = null;
        const current = auth.currentUser;
        if (current) {
          idToken = await current.getIdToken();
        } else {
          idToken = localStorage.getItem('token');
        }

        if (idToken) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${API_URL}/api/user/profile`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            const name = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.displayName || data.email || '';
            if (mounted && name) setProfileName(name);
            /**
             * Merge profile data into localStorage.user for later use.
             */
            try {
              const raw = localStorage.getItem('user');
              const parsed = raw ? JSON.parse(raw) : {};
              const merged = { ...parsed, ...data };
              localStorage.setItem('user', JSON.stringify(merged));
            } catch (e) { /* ignore */ }
          } else {
            /**
             * Fallback to localStorage if profile fetch fails.
             */
            const profileUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
            try {
              if (profileUserRaw) {
                const parsed = JSON.parse(profileUserRaw);
                const name = parsed?.firstName && parsed?.lastName ? `${parsed.firstName} ${parsed.lastName}` : parsed?.displayName || parsed?.email || '';
                if (mounted && name) setProfileName(name);
              }
            } catch (e) {
              if (mounted) setProfileName(profileUserRaw || '');
            }
          }
        }
      } catch (err) {
        /**
         * Fallback to localStorage if profile fetch fails.
         */
        const profileUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        try {
          if (profileUserRaw) {
            const parsed = JSON.parse(profileUserRaw);
            const name = parsed?.firstName && parsed?.lastName ? `${parsed.firstName} ${parsed.lastName}` : parsed?.displayName || parsed?.email || '';
            if (mounted && name) setProfileName(name);
          }
        } catch (e) {
          if (mounted) setProfileName(profileUserRaw || '');
        }
      }

      const socket = socketService.connectSocket();

      socket.on('usersOnline', (users: any[]) => {
        const names = (users || []).map(u => (u?.userId || u?.name || u?.displayName || String(u))).slice(0, 10);
        if (mounted) setParticipants(names);
      });

      /**
       * Announce ourselves using profileName or fallback.
       */
      const announce = () => {
        if (!socket || !socket.emit) return;
        if (profileName) socket.emit('newUser', profileName);
        else {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          let fallback = '';
          try { if (raw) { const p = JSON.parse(raw); fallback = p?.displayName || p?.email || ''; } } catch (e) { fallback = raw || ''; }
          if (fallback) socket.emit('newUser', fallback);
        }
      };

      /**
       * Call announce once to notify server.
       */
      announce();

      return () => {
        mounted = false;
        const s = socketService.getSocket();
        if (s) s.off('usersOnline');
      };
    }

    void init();
  }, []);

  const handleLeaveMeeting = () => {
    /**
     * Here you can clean up additional state if needed (close sockets, etc.).
     */
>>>>>>> Stashed changes
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
              <span className="meeting__video-label">{profileName || 'Tú (video principal)'}</span>
            </div>

            {/* Show up to 3 participant tiles and provide a button to view more */}
            {participants && participants.length > 0 ? (
              participants.slice(0, 3).map((p, idx) => (
                <div key={p + idx} className="meeting__video-tile">
                  <span className="meeting__video-label">{p}</span>
                </div>
              ))
            ) : (
              // Fallback placeholders when no participants info available
              <>
                <div className="meeting__video-tile"><span className="meeting__video-label">Participante 1</span></div>
                <div className="meeting__video-tile"><span className="meeting__video-label">Participante 2</span></div>
                <div className="meeting__video-tile"><span className="meeting__video-label">Participante 3</span></div>
              </>
            )}

            {/* If there are more participants, show a small pill/button */}
            {participants.length > 3 && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
                <button className="btn btn--ghost" onClick={() => setShowAll(true)}>
                  Ver más participantes ({Math.min(participants.length, 10)})
                </button>
              </div>
            )}
          </div>

          {/* Modal / panel showing up to 10 participants */}
          {showAll && (
            <div className="participants-modal" role="dialog" aria-modal="true">
              <div className="participants-modal-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Participantes ({Math.min(participants.length, 10)})</h3>
                  <button className="btn" onClick={() => setShowAll(false)}>Cerrar</button>
                </div>
                <ul className="participants-list">
                  {participants.slice(0, 10).map((p, i) => (
                    <li key={p + i} className="participant-item">{p}</li>
                  ))}
                </ul>
              </div>
            </div>
<<<<<<< Updated upstream
=======

            {/* Show up to 3 participant tiles and provide a button to view more */}
            {participants && participants.length > 0 ? (
              participants.slice(0, 3).map((p, idx) => (
                <div key={p + idx} className="meeting__video-tile">
                  <span className="meeting__video-label">{p}</span>
                </div>
              ))
            ) : (
              /**
               * Fallback placeholders when no participants info available.
               */
              <>
                <div className="meeting__video-tile"><span className="meeting__video-label">Participante 1</span></div>
                <div className="meeting__video-tile"><span className="meeting__video-label">Participante 2</span></div>
                <div className="meeting__video-tile"><span className="meeting__video-label">Participante 3</span></div>
              </>
            )}

            {/* If there are more participants, show a small pill/button */}
            {participants.length > 3 && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
                <button className="btn btn--ghost" onClick={() => setShowAll(true)}>
                  Ver más participantes ({Math.min(participants.length, 10)})
                </button>
              </div>
            )}
>>>>>>> Stashed changes
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
          <Chat initialName={profileName} />
        </aside>
      </section>
    </div>
  );
};

export default Meeting;
