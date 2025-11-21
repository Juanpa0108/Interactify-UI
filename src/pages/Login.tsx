import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
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
