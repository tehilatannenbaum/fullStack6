import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('login'); // login, register
  const [registeredUsername, setRegisteredUsername] = useState(''); // helper to pass registered username to login form
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user session exists in LocalStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored session:', e);
        localStorage.clear();
      }
    }
    setCheckingSession(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleRegisterSuccess = (username) => {
    setRegisteredUsername(username);
    setPage('login');
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setPage('login');
    window.location.hash = '';
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (checkingSession) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifycontent: 'center',
        height: '100vh',
        color: 'var(--text-muted)'
      }}>
        Verifying session...
      </div>
    );
  }

  if (currentUser) {
    return (
      <Dashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  if (page === 'register') {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateToLogin={() => setPage('login')}
      />
    );
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onNavigateToRegister={() => setPage('register')}
      initialUsername={registeredUsername}
    />
  );
}

export default App;
