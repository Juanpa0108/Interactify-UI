import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./recovery.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Recovery: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const logoSrc = '/logoInteractify.jpeg';

  const handleEmailChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (error && newEmail.includes("@") && newEmail.includes(".")) {
      setError("");
    }

    if (message) setMessage("");
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!email.includes("@") || !email.includes(".")) {
      setError("Por favor ingresa un correo electrónico válido.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.id || data.userId) {
          navigate(`/resetPassword?id=${data.id || data.userId}`);
        } else {
          setMessage("¡Enlace de recuperación enviado exitosamente!");
        }
      } else {
        setError(data.message || "Error al enviar el enlace de recuperación.");
      }
    } catch (err) {
      setError("Ocurrió un error. Por favor intenta de nuevo.");
      console.error("Recovery error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-page">
      <div className="recovery-wrapper">
        <div className="recovery-card">
          <div className="recovery-header">
            <img src={logoSrc} alt="Interactify logo" className="recovery-logo" />
            <h1>Recuperar Contraseña</h1>
          </div>

          <p className="recovery-subtitle">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <div className="recovery-error">
              <span className="recovery-error-icon">⚠️</span>
              {error}
            </div>
          )}

          {message && (
            <div className="recovery-success">
              <span className="recovery-success-icon">✅</span>
              {message}
            </div>
          )}

          <form className="recovery-form" onSubmit={handleSubmit}>
            <div className="recovery-input-group">
              <label htmlFor="email" className="recovery-label">
                Correo electrónico
              </label>
              <div className="recovery-input-wrapper">
                <span className="recovery-input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  disabled={loading}
                  className="recovery-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="recovery-btn"
            >
              {loading ? (
                <>
                  <span className="recovery-spinner"></span>
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </button>

            <div className="recovery-back">
              <Link to="/login" className="recovery-link">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Recovery;