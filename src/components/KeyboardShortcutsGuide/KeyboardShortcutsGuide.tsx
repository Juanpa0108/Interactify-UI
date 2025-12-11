import React from 'react';
import './KeyboardShortcutsGuide.scss';

interface KeyboardShortcutsGuideProps {
  show: boolean;
  onClose: () => void;
}

const KeyboardShortcutsGuide: React.FC<KeyboardShortcutsGuideProps> = ({ show, onClose }) => {
  if (!show) return null;

  const shortcuts = [
    { keys: 'Ctrl + D', description: 'Activar/Desactivar micrófono' },
    { keys: 'Ctrl + E', description: 'Activar/Desactivar cámara' },
    { keys: 'Ctrl + H', description: 'Mostrar/Ocultar chat' },
    { keys: 'Ctrl + K', description: 'Mostrar esta guía de atajos' },
    { keys: 'Esc', description: 'Cerrar guía de atajos' },
  ];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="shortcuts-modal-overlay" onClick={handleBackdropClick}>
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <h2>Atajos de teclado</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="shortcuts-content">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="shortcut-item">
              <kbd className="shortcut-keys">{shortcut.keys}</kbd>
              <span className="shortcut-description">{shortcut.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide;
