import React, { useState } from 'react';
import Loader from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';

import '../styles/Login.css';
import { auth, githubProvider, googleProvider } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login: React.FC = () => {
  const navigate = useNavigate();
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
      navigate('/');
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
      // Autenticar con Google usando Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Verificar con el backend
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
      navigate('/');
    } catch (err: any) {
      console.error('Error en login con Google:', err);
      const msg = String(err?.message || err);
      // If popup fails due to COOP/popup blocking, fall back to redirect flow
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || /Cross-Origin-Opener-Policy|Could not establish connection|popup blocked/i.test(msg)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return; // redirect started; user will be returned to app
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error('Login with GitHub failed');
      const data = await response.json();
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user || result.user));
      navigate('/');
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message || err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || /Cross-Origin-Opener-Policy|Could not establish connection|popup blocked/i.test(msg)) {
        try {
          await signInWithRedirect(auth, githubProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect fallback failed:', redirectErr);
        }
      }

      setError(err.message || 'Error al iniciar sesión con GitHub');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page login-bg">
      <div className="auth-wrapper">
        <div className="auth-image"><img src={imgSrc} alt="Team working" /></div>

        <div className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <img src={logoSrc} alt="logo" className="auth-logo" />
              <h1>Iniciar sesión</h1>
            </div>
            <p className="lead">Bienvenido de nuevo — inicia sesión para continuar en Interactify.</p>

            {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: '4px' }}>{error}</div>}

            {loading ? (
              <Loader />
            ) : (
              <form className="auth-form" onSubmit={handleEmailLogin}>
                <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <div style={{ position: 'relative', width: '100%' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: 40 }} />
                  <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(s => !s)} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', padding: 4, cursor: 'pointer' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="auth-row"><a className="auth-link" href="#">¿Olvidaste tu contraseña?</a></div>
                <button className="auth-btn" type="submit" disabled={loading}>{'Iniciar sesión'}</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <small className="small">O continúa con</small>
                  <div className="social-row">
                    <button type="button" className="social-btn" onClick={handleGoogleLogin} disabled={loading} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><img src={'/googleLogo.png'} alt="google" style={{ height:18 }} /></button>
                    <button type="button" className="social-btn" onClick={handleGitHubLogin} disabled={loading} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><img src={'/githubLogo.png'} alt="github" style={{ height:18 }} /></button>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <span className="small">¿No tienes una cuenta? </span>
                  <Link className="auth-link" to="/register">Crear una cuenta</Link>
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
 
