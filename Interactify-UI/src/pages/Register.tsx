import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import '../styles/Register.css';

const MIN_AGE = 13;
const MIN_PWD_LENGTH = 6; // Cambiado a 6 según los requisitos
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasNumber = (s: string) => /[0-9]/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s);

const Register: React.FC = () => {
  const navigate = useNavigate();
  const imgSrc = import.meta.env.PUBLIC_URL + '/registerImage.avif';
  const logoSrc = import.meta.env.PUBLIC_URL + '/logoInteractify.jpeg';

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
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Registrar en el backend con información adicional
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password, // El backend no lo usará porque Firebase ya lo maneja, pero lo enviamos por compatibilidad
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar usuario');
      }

      // Guardar token en localStorage
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify(userCredential.user));

      // Redirigir al home o dashboard
      navigate('/');
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

            <p className="lead">Create your account in seconds</p>

            {error && (
              <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: '4px' }}>
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={onSubmit} aria-describedby="register-help">
            <div className="input-row">
              <label>
                <span className="sr-only">First name</span>
                <input
                  aria-label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  type="text"
                  placeholder="First name"
                  aria-invalid={submitted && !requirements.firstName}
                  required
                />
              </label>

              <label>
                <span className="sr-only">Last name</span>
                <input
                  aria-label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  type="text"
                  placeholder="Last name"
                  aria-invalid={submitted && !requirements.lastName}
                  required
                />
              </label>
            </div>

            <div className="input-row">
              <label>
                <span className="sr-only">Age</span>
                <input
                  aria-label="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  type="number"
                  placeholder="Age"
                  min={MIN_AGE}
                  aria-invalid={submitted && !requirements.ageOk}
                  required
                />
              </label>

              <label>
                <span className="sr-only">Email address</span>
                <input
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email address"
                  required
                />
              </label>
            </div>

            <div className="input-row">
              <label>
                <span className="sr-only">Password</span>
                <input
                  aria-label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  aria-describedby="pwd-req"
                  aria-invalid={submitted && !requirements.pwdLength}
                  required
                />
              </label>

              <label>
                <span className="sr-only">Confirm password</span>
                <input
                  aria-label="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type="password"
                  placeholder="Confirm password"
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
                <div className={`req ${requirements.pwdLength ? 'ok' : ''}`}><span className="dot" aria-hidden /><span>At least {MIN_PWD_LENGTH} characters</span></div>
                <div className={`req ${requirements.pwdMatch ? 'ok' : ''}`}><span className="dot" aria-hidden /><span>Passwords match</span></div>
              </div>
            </div>

            

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Create an account'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <small className="small">Already a member? </small>
              <div className="social-row" aria-hidden>
                <div className="social-btn"><img src={import.meta.env.PUBLIC_URL + '/googleLogo.png'} alt="google" style={{ height:18 }} /></div>
                <div className="social-btn"><img src={import.meta.env.PUBLIC_URL + '/githubLogo.png'} alt="github" style={{ height:18 }} /></div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span className="small">Or </span>
              <Link className="auth-link" to="/login">Log in</Link>
            </div>

            <div id="register-help" className="sr-only">Password must be at least {MIN_PWD_LENGTH} characters, include an uppercase letter, a number and a special character. Age must be {MIN_AGE} or older.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
