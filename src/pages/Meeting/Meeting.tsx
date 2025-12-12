import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaComments, FaPhoneSlash, FaKeyboard, FaCircle } from "react-icons/fa";
import "./Meeting.scss";
import Chat from "../../components/Chat/Chat";
import socketService from "../../services/socket";
import { auth } from "../../config/firebase";
import WebRTCManager from "../../services/webrtc";
import KeyboardShortcutsGuide from "../../components/KeyboardShortcutsGuide/KeyboardShortcutsGuide";

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
  const [videoOn, setVideoOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'desconectado'|'conectando'|'conectado'>('desconectado');
  const [remoteAudios, setRemoteAudios] = useState<Record<string, MediaStream>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [speakingPeers, setSpeakingPeers] = useState<Record<string, boolean>>({});
  const [showChat, setShowChat] = useState(true);
  const [ending, setEnding] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showShortcutsGuide, setShowShortcutsGuide] = useState(false);
  const rtcRef = React.useRef<WebRTCManager | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const peerAnalysersRef = React.useRef<Record<string, { analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> }>>({});
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
        try { rtcRef.current?.leave(); } catch (err) { console.error("Error leaving RTC connection:", err); }
        navigate("/", { replace: true });
      });

      socket.on('usersOnline', (users: any[]) => {
        const arr = (users || []).map((u: any) => ({ socketId: String(u?.socketId || ''), userId: String(u?.userId || '') }));
        console.log('[Meeting] usersOnline updated:', arr.map(u => ({ socketId: u.socketId, userId: u.userId })));
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

      let stream: MediaStream | null = null;
      try {
        const rtc = new WebRTCManager(socket, id || '', {
          onStream: (pid, stream) => {
            console.log('[Meeting] Remote stream received from peer:', pid, {
              videoTracks: stream.getVideoTracks().length,
              audioTracks: stream.getAudioTracks().length,
              videoEnabled: stream.getVideoTracks()[0]?.enabled
            });
            setRemoteAudios(prev => ({ ...prev, [pid]: stream }));
            setRemoteStreams(prev => ({ ...prev, [pid]: stream }));
            // setup analyser per remote stream
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current!;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            const src = ctx.createMediaStreamSource(stream);
            src.connect(analyser);
            const data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
            peerAnalysersRef.current[pid] = { analyser, data };
          },
          onParticipantLeft: (pid) => {
            console.log('[Meeting] Participant left:', pid);
            setRemoteAudios(prev => {
              const updated = { ...prev };
              delete updated[pid];
              return updated;
            });
            setRemoteStreams(prev => {
              const updated = { ...prev };
              delete updated[pid];
              return updated;
            });
            delete peerAnalysersRef.current[pid];
          }
        });
        rtcRef.current = rtc;

        stream = await rtc.initLocalMedia();
        setLocalStream(stream);

        // Check if video tracks exist and set initial state
        if (stream) {
          const videoTracks = stream.getVideoTracks();
          const hasVideo = videoTracks.length > 0;
          console.log('[Meeting] Local media initialized', {
            hasVideo,
            videoEnabled: hasVideo ? videoTracks[0].enabled : false,
            audioTracks: stream.getAudioTracks().length
          });
          // Start with video ON if available
          setVideoOn(hasVideo);
        }

        setConnectionStatus('conectando');
        await rtc.join();
      } catch (err: any) {
        if (err && (err as DOMException).name === 'NotAllowedError') {
          console.warn('[Meeting] User denied media permissions (camera/mic).', err);
        } else {
          console.error('[Meeting] Error initializing media/RTC:', err);
        }
        setConnectionStatus('desconectado');
        return;
      }

      // speaking indicator for local mic
      if (!audioCtxRef.current)
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      const ctx = audioCtxRef.current!;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const src = ctx.createMediaStreamSource(stream!);
      src.connect(analyser);

      // 🔥 FIX: crear ArrayBuffer explícito para evitar crash en deploy
      const data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setSpeaking(avg > 30);

        // update peers speaking
        const next: Record<string, boolean> = {};

        for (const [pid, obj] of Object.entries(peerAnalysersRef.current)) {
          // 🔥 FIX también para los peers en caso que su Uint8Array no coincida
          if (!obj.data || obj.data.length !== obj.analyser.frequencyBinCount) {
            obj.data = new Uint8Array(new ArrayBuffer(obj.analyser.frequencyBinCount));
          }

          obj.analyser.getByteFrequencyData(obj.data);
          const pavg = obj.data.reduce((a, b) => a + b, 0) / obj.data.length;
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

  // Sync localStream with video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('[Meeting] Local stream attached to video element', {
        videoTracks: localStream.getVideoTracks().length,
        audioTracks: localStream.getAudioTracks().length
      });
    }
  }, [localStream]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Escape to close shortcuts guide even when typing
        if (e.key === 'Escape' && showShortcutsGuide) {
          e.preventDefault();
          setShowShortcutsGuide(false);
        }
        return;
      }

      // Ctrl + D: Toggle microphone
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleToggleMic();
      }
      
      // Ctrl + E: Toggle camera
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        const next = !videoOn;
        setVideoOn(next);
        rtcRef.current?.toggleCamera(next);
      }
      
      // Ctrl + H: Toggle chat
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setShowChat(prev => !prev);
      }
      
      // Ctrl + K: Show keyboard shortcuts guide
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowShortcutsGuide(true);
      }
      
      // Escape: Close shortcuts guide
      if (e.key === 'Escape' && showShortcutsGuide) {
        e.preventDefault();
        setShowShortcutsGuide(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsGuide, micOn, showChat]);


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
                } catch (err) { console.error('Failed to copy code:', err); }
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
                } catch (err) { console.error('Failed to copy link:', err); }
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
                {(!localStream || localStream.getVideoTracks().length === 0 || !videoOn) && (
                  <div className="meeting__avatar">{(profileName || 'Tú').slice(0,1)}</div>
                )}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="meeting__video-element"
                  style={{ 
                    display: localStream && localStream.getVideoTracks().length > 0 && videoOn ? 'block' : 'none'
                  }}
                />
                <span className="meeting__video-label">{profileName || 'Tú'}</span>
                <button className={`meeting__mic-fab ${micOn ? 'on' : 'off'}`} onClick={handleToggleMic} aria-label="Toggle mic">
                  {micOn ? 'Mic ON' : 'Mic OFF'}
                </button>
                {speaking && <div className="meeting__speaking-pulse" aria-hidden="true" />}
              </div>
            </div>

            {/* Render only connected users with active audio streams */}
            {(() => {
              const availablePeerIds = Object.keys(remoteStreams);
              const onlineSocketIds = onlineUsers.map(u => u.socketId);
              console.log('[Meeting] Render check:', {
                availablePeerIds,
                onlineSocketIds,
                remoteStreamsCount: Object.keys(remoteStreams).length,
                onlineUsersCount: onlineUsers.length
              });
              return null;
            })()}
            {onlineUsers.filter(u => remoteStreams[u.socketId]).slice(0,3).map(({ socketId, userId }) => {
              const stream = remoteStreams[socketId];
              const hasVideo = stream && stream.getVideoTracks().length > 0;
              
              console.log('[Meeting] Rendering remote user:', userId || socketId, {
                hasVideo,
                videoTracks: stream?.getVideoTracks().length,
                videoEnabled: stream?.getVideoTracks()[0]?.enabled
              });
              
              return (
                <div key={socketId} className="meeting__video-tile">
                  <div className="meeting__video-simulated">
                    {hasVideo ? (
                      <video
                        autoPlay
                        playsInline
                        className="meeting__video-element"
                        ref={node => {
                          if (node && stream) {
                            try { 
                              node.srcObject = stream;
                              console.log('[Meeting] Video element attached for:', userId || socketId);
                            } catch (err) {
                              console.error('[Meeting] Error attaching stream:', err);
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="meeting__avatar">{(userId || socketId).slice(0,2).toUpperCase()}</div>
                    )}
                    <span className="meeting__video-label">{userId || socketId}</span>
                    {speakingPeers[socketId] && <div className="meeting__speaking-pulse" aria-hidden="true" />}
                  </div>
                </div>
              );
            })}

            {/* If there are more participants, show a small pill/button */}
            {onlineUsers.filter(u => remoteStreams[u.socketId]).length > 3 && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
                <button className="btn btn--ghost" onClick={() => setShowAll(true)}>
                  Ver más participantes ({Math.min(onlineUsers.filter(u => remoteStreams[u.socketId]).length, 10)})
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
                  {onlineUsers.filter(u => remoteStreams[u.socketId]).slice(0, 10).map((u, i) => (
                    <li key={u.socketId + i} className="participant-item">{u.userId || u.socketId}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <p className="meeting__hint">
            Video en tiempo real habilitado. Haz clic en el ícono de cámara para activar/desactivar tu video.
          </p>
          <div className="meeting__controls meeting__controls--in-card" role="toolbar" aria-label="Controles de la reunión">
            <div className="meeting__toolbar">
              <button
                className={`toolbar-btn icon ${micOn ? 'active' : ''}`}
                onClick={handleToggleMic}
                aria-label={micOn ? 'Apagar micrófono' : 'Encender micrófono'}
                title={micOn ? 'Apagar micrófono' : 'Encender micrófono'}
              >
                {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
              </button>
              <button
                className={`toolbar-btn icon ${videoOn ? 'active' : ''}`}
                onClick={async () => {
                  const next = !videoOn;
                  setVideoOn(next);
                  await rtcRef.current?.toggleCamera(next);
                }}
                aria-label={videoOn ? 'Apagar cámara' : 'Encender cámara'}
                title={videoOn ? 'Apagar cámara' : 'Encender cámara'}
              >
                <FaVideo />
              </button>
              <button
                className={`toolbar-btn icon ${showChat ? 'active' : ''}`}
                aria-controls="meeting-chat-panel"
                aria-expanded={showChat}
                onClick={() => setShowChat(v => !v)}
                aria-label={showChat ? 'Ocultar chat' : 'Mostrar chat'}
                title={showChat ? 'Ocultar chat' : 'Mostrar chat'}
              >
                <FaComments />
              </button>
              <button
                className="toolbar-btn icon shortcuts-btn"
                onClick={() => setShowShortcutsGuide(true)}
                aria-label="Mostrar atajos de teclado"
                title="Atajos de teclado (Ctrl+K)"
              >
                <FaKeyboard />
              </button>
              {isHost ? (
                <button
                  className="toolbar-btn icon end danger"
                  onClick={handleEndMeeting}
                  aria-label="Finalizar reunión"
                  title="Finalizar reunión"
                  disabled={ending}
                >
                  <FaPhoneSlash />
                </button>
              ) : (
                <button
                  className="toolbar-btn icon leave danger"
                  onClick={handleEndMeeting}
                  aria-label="Colgar llamada"
                  title="Colgar llamada"
                >
                  <FaPhoneSlash />
                </button>
              )}
              <span className="toolbar-status" aria-live="polite" title={`Estado: ${connectionStatus}`}>
                <FaCircle style={{ marginRight: 6 }} /> {connectionStatus}
              </span>
            </div>
            <span className={`speaking-indicator ${speaking ? 'speaking' : ''}`} aria-live="polite">Hablas</span>
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

        {/* Keyboard Shortcuts Guide Modal */}
        <KeyboardShortcutsGuide 
          show={showShortcutsGuide} 
          onClose={() => setShowShortcutsGuide(false)} 
        />
      </section>
    </div>
  );
};

export default Meeting;