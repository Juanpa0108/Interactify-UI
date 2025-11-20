import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

const Login: React.FC = () => {
  const imgSrc = process.env.PUBLIC_URL + '/loginImage.png';
  const logoSrc = process.env.PUBLIC_URL + '/logoInteractify.jpeg';

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

            <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Email address" required />

          <input type="password" placeholder="Password" required />

          <div className="auth-row">
            
            <a className="auth-link" href="#">Forgot password?</a>
          </div>

          <button className="auth-btn" type="submit">Log in</button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <small className="small">Or continue with</small>
            <div className="social-row">
              <div className="social-btn"><img src={process.env.PUBLIC_URL + '/googleLogo.png'} alt="google" style={{ height:18 }} /></div>
              <div className="social-btn"><img src={process.env.PUBLIC_URL + '/githubLogo.png'} alt="github" style={{ height:18 }} /></div>
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
