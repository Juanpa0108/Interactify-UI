import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "./Meeting.scss";
import Chat from "../../components/Chat/Chat";
import socketService from "../../services/socket";
import { auth } from "../../config/firebase";
import WebRTCManager from "../../services/webrtc";

/**
 * Meeting page component.
 * Shows the base layout for the video area and chat sidebar with real chat component.
 */
const Meeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const meetingUrl = window.location.href;
  const [copied, setCopied] = useState<'none'|'link'|'code'>('none');

  const [participants, setParticipants] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ socketId: string; userId: string }[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'desconectado'|'conectando'|'conectado'>('desconectado');
  const [remoteAudios, setRemoteAudios] = useState<Record<string, MediaStream>>({});
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});
  const [showChat, setShowChat] = useState(true);
  const [ending, setEnding] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const rtcRef = React.useRef<WebRTCManager | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const peerAnalysersRef = React.useRef<Record<string, { analyser: AnalyserNode; data: Uint8Array }>>({});
  const animationFrameRef = React.useRef<number | null>(null);

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
      // If someone ends the meeting, leave and redirect
      socket.on('meeting:ended', () => {
        try { rtcRef.current?.leave(); } catch {}
        navigate("/", { replace: true });
      });

      socket.on('usersOnline', (users: any[]) => {
        const arr = (users || []).map((u: any) => ({ socketId: String(u?.socketId || ''), userId: String(u?.userId || '') }));
        if (mounted) {
          setOnlineUsers(arr);
          setParticipants(arr.map(u => u.userId || u.socketId).slice(0,10));
        }
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

      // WebRTC setup
      const rtc = new WebRTCManager(socket, id || '', {
        onStream: (pid, stream) => {
          setRemoteAudios(prev => ({ ...prev, [pid]: stream }));
          // setup analyser per remote stream
          if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioCtxRef.current!;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          const src = ctx.createMediaStreamSource(stream);
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          peerAnalysersRef.current[pid] = { analyser, data };
        }
      });
      rtcRef.current = rtc;
      await rtc.initLocalAudio();
      setConnectionStatus('conectando');
      await rtc.join();

      // speaking indicator for local mic
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current!;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      const src = ctx.createMediaStreamSource((await rtc.initLocalAudio())!);
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        // TS lib mismatch: cast to plain Uint8Array for WebAudio typings
        analyser.getByteFrequencyData(data as unknown as Uint8Array);
        const avg = data.reduce((a,b)=>a+b,0)/data.length;
        setSpeaking(avg > 30);
        // update peers speaking
        const next: Record<string, boolean> = {};
        for (const [pid, obj] of Object.entries(peerAnalysersRef.current)) {
          obj.analyser.getByteFrequencyData(obj.data as unknown as Uint8Array);
          const pavg = obj.data.reduce((a,b)=>a+b,0)/obj.data.length;
          next[pid] = pavg > 30;
        }
        setSpeakingPeers(next);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);

      return () => {
        mounted = false;
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        const s = socketService.getSocket();
        if (s) {
          s.off('usersOnline');
          s.off('meeting:ended');
        }
        if (rtcRef.current) rtcRef.current.leave();
        analyserRef.current?.disconnect();
        audioCtxRef.current?.close();
        setConnectionStatus('desconectado');
      };
    }

    void init();
  }, []);

  // Check if current user is the meeting host
  useEffect(() => {
    let cancelled = false;
    async function checkHost() {
      try {
        const current = auth.currentUser;
        if (!current || !id) return;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = await current.getIdToken();
        const res = await fetch(`${API_URL}/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          // 404 means meeting not found on server (e.g., created client-only). Treat as non-host.
          if (!cancelled) setIsHost(false);
          return;
        }
        const data = await res.json();
        const creator = data?.creatorId ?? data?.meeting?.hostUid ?? data?.hostUid;
        if (!cancelled) setIsHost(String(creator || '') === current.uid);
      } catch {
        // Network errors: assume non-host to avoid blocking UI.
        if (!cancelled) setIsHost(false);
      }
    }
    checkHost();
    return () => { cancelled = true; };
  }, [id]);

  const handleLeaveMeeting = () => {
    // Aquí puedes limpiar estado adicional si lo necesitan (cerrar sockets, etc.)
    navigate("/", { replace: true });
  };

  const handleToggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    await rtcRef.current?.toggleMic(next);
  };

  const handleEndMeeting = async () => {
    if (ending) return;
    if (isHost) {
      const ok = window.confirm('¿Deseas finalizar la reunión para todos?');
      if (!ok) return;
      setEnding(true);
      try {
        const socket = socketService.getSocket();
        if (socket) socket.emit('meeting:end', { room: id });
        await rtcRef.current?.leave();
        navigate('/', { replace: true });
      } finally {
        setEnding(false);
      }
    } else {
      const socket = socketService.getSocket();
      if (socket) socket.emit('meeting:leave', { room: id });
      await rtcRef.current?.leave();
      navigate('/', { replace: true });
    }
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
          <div className="copy-actions">
            <button
              type="button"
              className="copy-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(String(id || ''));
                  setCopied('code');
                  setTimeout(() => setCopied('none'), 1600);
                } catch {}
              }}
            >Copiar código</button>
            <button
              type="button"
              className="copy-btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(meetingUrl);
                  setCopied('link');
                  setTimeout(() => setCopied('none'), 1600);
                } catch {}
              }}
            >Copiar enlace</button>
            {copied !== 'none' && (
              <span className="copy-toast">¡Copiado!</span>
            )}
          </div>
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
        role="region"
      >
        {/* Área de video (mock / sin funcionalidad) */}
        <div className="meeting__video-area" aria-label="Área de video">
          <div className="meeting__video-grid">
            <div className="meeting__video-tile meeting__video-tile--main">
              <div className="meeting__video-simulated">
                <div className="meeting__avatar">{(profileName || 'Tú').slice(0,1)}</div>
                <span className="meeting__video-label">{profileName || 'Tú'}</span>
                <button className={`meeting__mic-fab ${micOn ? 'on' : 'off'}`} onClick={handleToggleMic} aria-label="Toggle mic">
                  {micOn ? 'Mic ON' : 'Mic OFF'}
                </button>
                {speaking && <div className="meeting__speaking-pulse" aria-hidden="true" />}
              </div>
            </div>

            {/* Render only connected users with active audio streams */}
            {onlineUsers.filter(u => remoteAudios[u.socketId]).slice(0,3).map(({ socketId, userId }) => (
              <div key={socketId} className="meeting__video-tile">
                <div className="meeting__video-simulated">
                  <div className="meeting__avatar">{(userId || socketId).slice(0,2).toUpperCase()}</div>
                  <span className="meeting__video-label">{userId || socketId}</span>
                  {speakingPeers[socketId] && <div className="meeting__speaking-pulse" aria-hidden="true" />}
                </div>
              </div>
            ))}

            {/* If there are more participants, show a small pill/button */}
            {onlineUsers.filter(u => remoteAudios[u.socketId]).length > 3 && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
                <button className="btn btn--ghost" onClick={() => setShowAll(true)}>
                  Ver más participantes ({Math.min(onlineUsers.filter(u => remoteAudios[u.socketId]).length, 10)})
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
                  {onlineUsers.filter(u => remoteAudios[u.socketId]).slice(0, 10).map((u, i) => (
                    <li key={u.socketId + i} className="participant-item">{u.userId || u.socketId}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <p className="meeting__hint">
            Nota: el video en tiempo real se implementará en los próximos
            sprints. Esta vista solo representa el diseño de la sala.
          </p>
          <div className="meeting__controls meeting__controls--in-card" role="toolbar" aria-label="Controles de la reunión">
          <div className="meeting__toolbar">
            <button className={`toolbar-btn ${micOn ? 'active' : ''}`} onClick={handleToggleMic}>
              {micOn ? 'Micrófono ON' : 'Micrófono OFF'}
            </button>
            <button className="toolbar-btn" disabled>Video (próximamente)</button>
            <button
              className="toolbar-btn"
              aria-controls="meeting-chat-panel"
              aria-expanded={showChat}
              onClick={() => setShowChat(v => !v)}
            >{showChat ? 'Ocultar chat' : 'Mostrar chat'}</button>
            {isHost ? (
              <button
                className="toolbar-btn"
                onClick={handleEndMeeting}
                aria-label="Finalizar reunión"
              >{ending ? 'Finalizando…' : 'Finalizar reunión'}</button>
            ) : (
              <button
                className="toolbar-btn leave"
                onClick={handleEndMeeting}
                aria-label="Salir de la reunión"
              >Salir</button>
            )}
            <span className="toolbar-status" aria-live="polite">Estado: {connectionStatus}</span>
          </div>
          <span className={`speaking-indicator ${speaking ? 'speaking' : ''}`}>Hablas</span>
          </div>

        </div>

        {/* Panel de chat: component real */}
        <aside
          className={`meeting__chat-area ${showChat ? 'is-visible' : 'is-hidden'}`}
          aria-label="Panel de chat de la reunión"
          id="meeting-chat-panel"
          role="complementary"
        >
          <h2 className="meeting__chat-title">Chat de la reunión</h2>
          <Chat initialName={profileName} />
        </aside>

        {/* Remote audio elements always mounted (not tied to chat visibility) */}
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          {Object.entries(remoteAudios).map(([pid, stream]) => (
            <audio
              key={pid}
              autoPlay
              playsInline
              ref={node => {
                if (node && stream) {
                  try { (node as any).srcObject = stream; } catch {}
                }
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Meeting;
