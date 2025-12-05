import React, { useState } from 'react';
import Loader from '../components/Loader';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';

import '../styles/Login.css';
import { auth, githubProvider, googleProvider } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const imgSrc = '/loginImage.png';
  const logoSrc = '/logoInteractify.jpeg';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user || userCredential.user));
      const redirectTo = (location.state as any)?.from?.pathname || sessionStorage.getItem('postAuthRedirect') || '/';
      sessionStorage.removeItem('postAuthRedirect');
      navigate(redirectTo);
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/login/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión con Google');
      }

      const data = await response.json();
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user || result.user));
      const redirectTo = (location.state as any)?.from?.pathname || sessionStorage.getItem('postAuthRedirect') || '/';
      sessionStorage.removeItem('postAuthRedirect');
      navigate(redirectTo);
    } catch (err: any) {
      console.error('Error en login con Google:', err);
      const msg = String(err?.message || err);
      
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || /Cross-Origin-Opener-Policy|Could not establish connection|popup blocked/i.test(msg)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect fallback failed:', redirectErr);
        }
      }

      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const idToken = await result.user.getIdToken();
      const response = await fetch(`${API_URL}/api/auth/login/github`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error('Login with GitHub failed');
      const data = await response.json();
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user || result.user));
      const redirectTo = (location.state as any)?.from?.pathname || sessionStorage.getItem('postAuthRedirect') || '/';
      sessionStorage.removeItem('postAuthRedirect');
      navigate(redirectTo);
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message || err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || /Cross-Origin-Opener-Policy|Could not establish connection|popup blocked/i.test(msg)) {
        try {
          const intended = (location.state as any)?.from?.pathname || window.location.pathname || '/';
          sessionStorage.setItem('postAuthRedirect', intended);
          await signInWithRedirect(auth, githubProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect fallback failed:', redirectErr);
        }
      }

      setError(err.message || 'Error al iniciar sesión con GitHub');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-image">
          <img src={imgSrc} alt="Team working" />
        </div>

        <div className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <img src={logoSrc} alt="Interactify logo" className="auth-logo" />
              <h1>Iniciar sesión</h1>
            </div>
            
            <p className="auth-subtitle">
              Bienvenido de nuevo — inicia sesión para continuar en Interactify.
            </p>

            {error && (
              <div className="auth-error">
                <span className="auth-error-icon">⚠️</span>
                {error}
              </div>
            )}

            {loading ? (
              <div className="auth-loader">
                <Loader />
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleEmailLogin}>
                <div className="auth-input-group">
                  <label htmlFor="email" className="auth-label">Correo electrónico</label>
                  <input 
                    id="email"
                    type="email" 
                    placeholder="tu@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="auth-input"
                  />
                </div>

                <div className="auth-input-group">
                  <label htmlFor="password" className="auth-label">Contraseña</label>
                  <div className="auth-password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="auth-input"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(s => !s)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="auth-forgot">
                  <Link to="/recovery" className="auth-link-forgot">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
                  Iniciar sesión
                </button>

                <div className="auth-divider">
                  <span>O continúa con</span>
                </div>

                <div className="auth-social">
                  <button 
                    type="button" 
                    className="auth-social-btn" 
                    onClick={handleGoogleLogin} 
                    disabled={loading}
                    aria-label="Continuar con Google"
                  >
                    <img src="/googleLogo.png" alt="" />
                    <span>Google</span>
                  </button>
                  
                  <button 
                    type="button" 
                    className="auth-social-btn" 
                    onClick={handleGitHubLogin} 
                    disabled={loading}
                    aria-label="Continuar con GitHub"
                  >
                    <img src="/githubLogo.png" alt="" />
                    <span>GitHub</span>
                  </button>
                </div>

                <div className="auth-register">
                  <span>¿No tienes una cuenta?</span>
                  <Link to="/register" className="auth-link-register">
                    Crear cuenta
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;