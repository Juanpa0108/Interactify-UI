import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import '../styles/Login.css';

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
      // Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Verificar con el backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión');
      }

      const data = await response.json();

      // Guardar token en localStorage
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al home
      navigate('/');
    } catch (err: any) {
      console.error('Error en login:', err);
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Autenticar con Google
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Verificar con el backend
      const response = await fetch(`${API_URL}/api/auth/login/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión con Google');
      }

      const data = await response.json();

      // Guardar token en localStorage
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al home
      navigate('/');
    } catch (err: any) {
      console.error('Error en login con Google:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Autenticar con GitHub
      const result = await signInWithPopup(auth, githubProvider);
      const idToken = await result.user.getIdToken();

      // Verificar con el backend
      const response = await fetch(`${API_URL}/api/auth/login/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión con GitHub');
      }

      const data = await response.json();

      // Guardar token en localStorage
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir al home
      navigate('/');
    } catch (err: any) {
      console.error('Error en login con GitHub:', err);
      setError(err.message || 'Error al iniciar sesión con GitHub');
    } finally {
      setLoading(false);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const imgSrc = import.meta.env.PUBLIC_URL + '/loginImage.png';
  const logoSrc = import.meta.env.PUBLIC_URL + '/logoInteractify.jpeg';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simulamos proceso de autenticación.
    if (email === "user@example.com" && password === "password123!") {
      // Guardamos el token 
      const token = "sample-auth-token";
      localStorage.setItem('authToken', token);  // Guardamos el token

      // Redirigimos a la página de creación de reuniones o home
      navigate('/create');
    } else {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-image"><img src={imgSrc} alt="Team working" /></div>

        <div className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <img src={logoSrc} alt="logo" className="auth-logo" />
              <h1>Login</h1>
            </div>
            <p className="lead">Welcome back — sign in to continue to Interactify.</p>

            {error && (
              <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleEmailLogin}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((s) => !s)}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    padding: 4,
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-8 1.42-3.44 4.58-6 8-6 1.38 0 2.68.35 3.82.96" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="auth-row">
                <a className="auth-link" href="#">Forgot password?</a>
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Log in'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <small className="small">Or continue with</small>
                <div className="social-row">
                  <button
                    type="button"
                    className="social-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <img src={'/googleLogo.png'} alt="google" style={{ height:18 }} />
                  </button>
                  <button
                    type="button"
                    className="social-btn"
                    onClick={handleGitHubLogin}
                    disabled={loading}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <img src={'/githubLogo.png'} alt="github" style={{ height:18 }} />
                  </button>
                </div>
              </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <input 
                type="email" 
                placeholder="Email address" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />

              <input 
                type="password" 
                placeholder="Password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />

              <div className="auth-row">
                <a className="auth-link" href="#">Forgot password?</a>
              </div>

              <button className="auth-btn" type="submit">Log in</button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <small className="small">Or continue with</small>
                <div className="social-row">
                  <div className="social-btn"><img src={import.meta.env.PUBLIC_URL + '/googleLogo.png'} alt="google" style={{ height:18 }} /></div>
                  <div className="social-btn"><img src={import.meta.env.PUBLIC_URL + '/githubLogo.png'} alt="github" style={{ height:18 }} /></div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span className="small">Don't have an account? </span>
                <Link className="auth-link" to="/register">Create an account</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
