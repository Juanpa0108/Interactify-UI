import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, githubProvider, googleProvider } from '../config/firebase';
import '../styles/Register.css';


const MIN_AGE = 13;
const MIN_PWD_LENGTH = 6;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const imgSrc = '/registerImage.avif';
  const logoSrc = '/logoInteractify.jpeg';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ageNum = Number(age || 0);

  const requirements = useMemo(() => ({
    firstName: firstName.trim().length > 0,
    lastName: lastName.trim().length > 0,
    ageOk: !isNaN(ageNum) && ageNum >= MIN_AGE,
    pwdLength: password.length >= MIN_PWD_LENGTH,
    pwdMatch: password.length > 0 && password === confirm,
  }), [firstName, lastName, ageNum, password, confirm]);

  const totalReq = Object.keys(requirements).length;
  const passed = Object.values(requirements).filter(Boolean).length;
  const progress = Math.round((passed / totalReq) * 100);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const ok = Object.values(requirements).every(Boolean);
    
    if (!ok) {
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          firstName,
          lastName,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar usuario');
      }

      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(userCredential.user));

      const redirectTo = (location.state as any)?.from?.pathname || sessionStorage.getItem('postAuthRedirect') || '/';
      sessionStorage.removeItem('postAuthRedirect');
      navigate(redirectTo);
    } catch (err: any) {
      console.error('Error en registro:', err);
      let errorMessage = 'Error al crear la cuenta';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'El email ya está registrado';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

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
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/');
    } catch (err: any) {
      console.error('Error en registro/login con Google:', err);
      const msg = String(err?.message || err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user' || /Cross-Origin-Opener-Policy|Could not establish connection|popup blocked/i.test(msg)) {
        try {
          const intended = (location.state as any)?.from?.pathname || window.location.pathname || '/';
          sessionStorage.setItem('postAuthRedirect', intended);
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
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      const redirectTo = (location.state as any)?.from?.pathname || sessionStorage.getItem('postAuthRedirect') || '/';
      sessionStorage.removeItem('postAuthRedirect');
      navigate(redirectTo);
    } catch (err: any) {
      console.error('Error en login con GitHub:', err);
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
    <div className="register-page">
      <div className="register-wrapper">
        <div className="register-image">
          <img src={imgSrc} alt="Sign up illustration" />
        </div>

        <div className="register-card">
          <div className="register-card-inner">
            <div className="register-header">
              <img src={logoSrc} alt="Interactify logo" className="register-logo" />
              <h1>Crear Cuenta</h1>
            </div>

            <p className="register-subtitle">
              Únete a Interactify y comienza a colaborar en segundos
            </p>

            {error && (
              <div className="register-error">
                <span className="register-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form className="register-form" onSubmit={onSubmit}>
              <div className="register-row">
                <div className="register-input-group">
                  <label htmlFor="firstName" className="register-label">Nombre</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="register-input"
                    required
                  />
                </div>

                <div className="register-input-group">
                  <label htmlFor="lastName" className="register-label">Apellido</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="register-input"
                    required
                  />
                </div>
              </div>

              <div className="register-row">
                <div className="register-input-group">
                  <label htmlFor="age" className="register-label">Edad</label>
                  <input
                    id="age"
                    type="number"
                    placeholder="18"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={MIN_AGE}
                    className="register-input"
                    required
                  />
                </div>

                <div className="register-input-group">
                  <label htmlFor="email" className="register-label">Correo electrónico</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="register-input"
                    required
                  />
                </div>
              </div>

              <div className="register-input-group">
                <label htmlFor="password" className="register-label">Contraseña</label>
                <div className="register-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="register-input"
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="register-input-group">
                <label htmlFor="confirm" className="register-label">Confirmar contraseña</label>
                <div className="register-password-wrapper">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="register-input"
                    required
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowConfirm(s => !s)}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              <div className="register-requirements">
                <div className="register-progress-bar">
                  <div 
                    className="register-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="register-req-list">
                  <div className={`register-req ${requirements.pwdLength ? 'register-req--ok' : ''}`}>
                    <span className="register-req-dot" />
                    <span>Mínimo {MIN_PWD_LENGTH} caracteres</span>
                  </div>
                  <div className={`register-req ${requirements.pwdMatch ? 'register-req--ok' : ''}`}>
                    <span className="register-req-dot" />
                    <span>Las contraseñas coinciden</span>
                  </div>
                  <div className={`register-req ${requirements.ageOk ? 'register-req--ok' : ''}`}>
                    <span className="register-req-dot" />
                    <span>Edad mínima: {MIN_AGE} años</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="register-btn"
              >
                {loading ? (
                  <>
                    <span className="register-spinner"></span>
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>

              <div className="register-divider">
                <span>O continúa con</span>
              </div>

              <div className="register-social">
                <button 
                  type="button" 
                  className="register-social-btn" 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                >
                  <img src="/googleLogo.png" alt="" />
                  <span>Google</span>
                </button>
                
                <button 
                  type="button" 
                  className="register-social-btn" 
                  onClick={handleGitHubLogin} 
                  disabled={loading}
                >
                  <img src="/githubLogo.png" alt="" />
                  <span>GitHub</span>
                </button>
              </div>

              <div className="register-login">
                <span>¿Ya tienes una cuenta?</span>
                <Link to="/login" className="register-link">
                  Iniciar sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;