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
        <h2>Chat</h2>
        <div className={`status ${connected ? 'online' : 'offline'}`}>{connected ? 'Connected' : 'Disconnected'}</div>
      </div>

      <div className="chat-controls">
        <input placeholder="Your display name" value={name} onChange={e => setName(e.target.value)} />
        <div className="online-count">Online: {online.length}</div>
      </div>

      <div className="chat-window">
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
        <input placeholder="Write a message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
