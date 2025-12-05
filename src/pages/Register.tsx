import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, githubProvider, googleProvider } from '../config/firebase';


const MIN_AGE = 13;
/**
 * Minimum password length required by the application.
 */
const MIN_PWD_LENGTH = 6; // Changed to 6 according to requirements
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Register component for Interactify.
 * Allows users to create an account using email/password, Google, or GitHub.
 * Handles registration, error display, and redirects after signup.
 * @returns {JSX.Element} Registration form and social signup options.
 */
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
  const [submitted, setSubmitted] = useState(false);
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

  /**
   * Handles registration with email and password.
   * @param {React.FormEvent} e - Form submit event.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError('');
    const ok = Object.values(requirements).every(Boolean);
    
    if (!ok) {
      return;
    }

    setLoading(true);

    try {
      /**
       * Create user in Firebase Auth.
       */
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      /**
       * Register in backend: send idToken for server verification.
       */
      /**
       * Create profile in Firestore (prevents duplicate user creation).
       */
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

      /**
       * Save token in localStorage.
       */
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(userCredential.user));

<<<<<<< Updated upstream
      // Redirigir al home o dashboard
      navigate('/');
=======
      /**
       * Redirect back to the intended route (meeting link) if present.
       */
      const redirectTo = (location.state as any)?.from?.pathname || sessionStorage.getItem('postAuthRedirect') || '/';
      sessionStorage.removeItem('postAuthRedirect');
      navigate(redirectTo);
>>>>>>> Stashed changes
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

  /**
   * Handles registration/login with Google using Firebase Auth.
   */
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      /**
       * Authenticate with Google using Firebase Auth.
       */
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      /**
       * Verify authentication with backend server.
       */
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

      /**
       * Save token in localStorage.
       */
      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      /**
       * Redirect to home after successful login.
       */
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

  /**
   * Handles registration/login with GitHub using Firebase Auth.
   */
  const handleGitHubLogin = async () => {
    setError('');
    setLoading(true);

    try {
      /**
       * Authenticate with GitHub using Firebase Auth.
       */
      const result = await signInWithPopup(auth, githubProvider);
      const idToken = await result.user.getIdToken();

      /**
       * Verify authentication with backend server.
       */
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

      /**
       * Save token in localStorage.
       */
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
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-image" aria-hidden="true"><img src={imgSrc} alt="Sign up illustration" /></div>

        <div className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <img src={logoSrc} alt="logo" className="auth-logo" />
              <h1>Registro</h1>
            </div>

            <p className="lead">Crea tu cuenta en segundos</p>

            {error && (
              <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={onSubmit} aria-describedby="register-help">
            <div className="input-row">
              <label>
                <span className="sr-only">Nombre</span>
                <input
                  aria-label="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  type="text"
                  placeholder="Nombre"
                  aria-invalid={submitted && !requirements.firstName}
                  required
                />
              </label>

              <label>
                <span className="sr-only">Apellido</span>
                <input
                  aria-label="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  type="text"
                  placeholder="Apellido"
                  aria-invalid={submitted && !requirements.lastName}
                  required
                />
              </label>
            </div>

            <div className="input-row">
              <label>
                <span className="sr-only">Edad</span>
                <input
                  aria-label="Edad"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  type="number"
                  placeholder="Edad"
                  min={MIN_AGE}
                  aria-invalid={submitted && !requirements.ageOk}
                  required
                />
              </label>

              <label>
                <span className="sr-only">Correo electrónico</span>
                <input
                  aria-label="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Correo electrónico"
                  required
                />
              </label>
            </div>

            <div className="input-row">
              <label>
                <span className="sr-only">Contraseña</span>
                <input
                  aria-label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Contraseña"
                  aria-describedby="pwd-req"
                  aria-invalid={submitted && !requirements.pwdLength}
                  required
                />
              </label>

              <label>
                <span className="sr-only">Confirmar contraseña</span>
                <input
                  aria-label="Confirmar contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type="password"
                  placeholder="Confirmar contraseña"
                  aria-invalid={submitted && !requirements.pwdMatch}
                  required
                />
              </label>
            </div>

            <div className="pwd-requirements" id="pwd-req" aria-live="polite">
              <div className="pwd-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Password strength">
                <i style={{ width: `${progress}%` }} />
              </div>

              <div className="req-list">
                <div className={`req ${requirements.pwdLength ? 'ok' : ''}`}><span className="dot" aria-hidden /><span>Al menos {MIN_PWD_LENGTH} caracteres</span></div>
                <div className={`req ${requirements.pwdMatch ? 'ok' : ''}`}><span className="dot" aria-hidden /><span>Las contraseñas coinciden</span></div>
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <small className="small">¿Ya tienes una cuenta? </small>
              <div className="social-row" aria-hidden>
                <button
                  type="button"
                  className="social-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <img src="/googleLogo.png" alt="google" style={{ height:18 }} />
                </button>
                <button
                  type="button"
                  className="social-btn"
                  onClick={handleGitHubLogin}
                  disabled={loading}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <img src="/githubLogo.png" alt="github" style={{ height:18 }} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span className="small">O </span>
              <Link className="auth-link" to="/login">Iniciar sesión</Link>
            </div>

            <div id="register-help" className="sr-only">La contraseña debe tener al menos {MIN_PWD_LENGTH} caracteres. La edad debe ser {MIN_AGE} o mayor.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
