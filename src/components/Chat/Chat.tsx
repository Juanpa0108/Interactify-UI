import React, { useEffect, useRef, useState } from 'react';
import socketService from '../../services/socket';
import './Chat.css';

type Message = {
  userId: string; // we'll use this field to carry display name
  message: string;
  timestamp: string;
};

type Props = {
  initialName?: string;
};

const Chat: React.FC<Props> = ({ initialName }) => {
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState(initialName ?? '');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [online, setOnline] = useState<{ socketId: string; userId: string }[]>([]);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // If an initialName is provided (from profile), ensure it's set
    // and announced to the server immediately.
    if (initialName) {
      setName(initialName);
    }
    const socket = socketService.connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('usersOnline', (users: any[]) => setOnline(users));

    socket.on('chat:message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('usersOnline');
      socket.off('chat:message');
      socketService.disconnectSocket();
    };
  }, []);

  // If the parent later provides an initialName (profile fetched after mount),
  // update the local name and announce it via the existing name effect.
  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  useEffect(() => {
    // When name changes and socket available, announce user
    if (socketRef.current && name.trim()) {
      socketRef.current.emit('newUser', name.trim());
    }
  }, [name]);

  function sendMessage() {
    const textTrim = text.trim();
    if (!textTrim) return;

    const payload = {
      userId: name || 'Anonymous',
      message: textTrim,
      timestamp: new Date().toISOString(),
    };

    // Emit message to server and let the server broadcast it back.
    // Avoid adding the message locally here to prevent duplicate entries
    // (the server will send the message back to all clients including sender).
    socketRef.current.emit('chat:message', payload);
    setText('');
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2 id="chat-heading">Chat</h2>
        <div
          className={`status ${connected ? 'online' : 'offline'}`}
          role="status"
          aria-live="polite"
        >
          {connected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      <div className="chat-controls">
        <label htmlFor="chat-name" className="visually-hidden">
          Nombre para mostrar
        </label>
        <input
          id="chat-name"
          placeholder="Tu nombre visible en el chat"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={!!initialName}
          title={initialName ? 'El nombre proviene de tu perfil y no es editable' : undefined}
          aria-describedby="chat-name-help"
        />
        <div id="chat-name-help" className="visually-hidden">
          Este nombre se mostrará a otros usuarios en el chat.
        </div>
        <div className="online-count">En línea: {online.length}</div>
      </div>

      <div
        className="chat-window"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.userId === name ? 'mine' : ''}`}>
            <div className="meta">
              <strong className="username">{m.userId}</strong>
              <span className="time">{new Date(m.timestamp).toLocaleString()}</span>
            </div>
            <div className="text">{m.message}</div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <label htmlFor="chat-message" className="visually-hidden">
          Mensaje
        </label>
        <input
          id="chat-message"
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
};

export default Chat;
