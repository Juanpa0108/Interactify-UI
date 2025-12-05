import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./resetPassword.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const logoSrc = '/logoInteractify.jpeg';
  
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setError("Enlace de restablecimiento inválido.");
    } else {
      setUserId(id);
    }
  }, [searchParams]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!userId) {
      setError("Enlace de restablecimiento inválido.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password?id=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.msg || "¡Contraseña restablecida exitosamente! Redirigiendo...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || "No se pudo restablecer la contraseña.");
      }
    } catch (err) {
      setError("Ocurrió un error. Por favor intenta de nuevo.");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-wrapper">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <img src={logoSrc} alt="Interactify logo" className="reset-password-logo" />
            <h1>Restablecer Contraseña</h1>
          </div>

          <p className="reset-password-subtitle">
            Ingresa tu nueva contraseña a continuación
          </p>

          {error && (
            <div className="reset-password-error">
              <span className="reset-error-icon">⚠️</span>
              {error}
            </div>
          )}

          {message && (
            <div className="reset-password-success">
              <span className="reset-success-icon">✅</span>
              {message}
            </div>
          )}

          <form className="reset-password-form" onSubmit={handleSubmit}>
            <div className="reset-input-group">
              <label htmlFor="password" className="reset-label">Nueva contraseña</label>
              <div className="reset-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="reset-input"
                  required
                  disabled={loading || !userId}
                />
                <button
                  type="button"
                  className="reset-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || !userId}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="reset-input-group">
              <label htmlFor="confirmPassword" className="reset-label">Confirmar contraseña</label>
              <div className="reset-password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="reset-input"
                  required
                  disabled={loading || !userId}
                />
                <button
                  type="button"
                  className="reset-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading || !userId}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !userId}
              className="reset-btn"
            >
              {loading ? (
                <>
                  <span className="reset-spinner-small"></span>
                  Restableciendo...
                </>
              ) : (
                "Restablecer contraseña"
              )}
            </button>

            <div className="reset-back">
              <Link to="/login" className="reset-link">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;