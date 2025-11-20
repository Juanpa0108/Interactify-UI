import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/pages/Login';
import Register from './components/pages/Register';

const TitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/register')) document.title = 'Register';
    else if (path.startsWith('/login')) document.title = 'Login';
    else document.title = 'Interactify';
  }, [location]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TitleUpdater />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
