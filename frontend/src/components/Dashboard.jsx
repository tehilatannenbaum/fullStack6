import React, { useState, useEffect } from 'react';
import TodosTab from './TodosTab.jsx';
import PostsTab from './PostsTab.jsx';
import AlbumsTab from './AlbumsTab.jsx';

const Dashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('todos'); // todos, posts, albums
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Synchronize hash routing with active tab
  useEffect(() => {
    // When activeTab changes, update URL hash
    window.location.hash = `/users/${currentUser.username}/${activeTab}`;
  }, [activeTab, currentUser]);

  // Handle URL change on back/forward or typing in URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.endsWith('/posts')) {
        setActiveTab('posts');
      } else if (hash.endsWith('/albums')) {
        setActiveTab('albums');
      } else {
        setActiveTab('todos');
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="app-container dashboard-container">
      {/* Top Navbar */}
      <header className="dash-header">
        <div className="logo">
          <span>⚛️</span> JSONPlaceholder Hub
        </div>
        <div className="user-controls">
          <span className="user-badge">👤 {currentUser.name}</span>
          <button className="btn btn-secondary" onClick={() => setInfoModalOpen(true)}>
            Info
          </button>
          <button className="btn btn-danger" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid: Sidebar + Current Content */}
      <div className="dash-body">
        <aside className="sidebar">
          <button
            className={`sidebar-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            📋 Tasks (Todos)
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            ✍️ Posts & Comments
          </button>
          <button
            className={`sidebar-btn ${activeTab === 'albums' ? 'active' : ''}`}
            onClick={() => setActiveTab('albums')}
          >
            📸 Albums & Photos
          </button>
        </aside>

        <main className="main-content">
          {activeTab === 'todos' && <TodosTab currentUser={currentUser} />}
          {activeTab === 'posts' && <PostsTab currentUser={currentUser} />}
          {activeTab === 'albums' && <AlbumsTab currentUser={currentUser} />}
        </main>
      </div>

      {/* Profile Details Modal */}
      {infoModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setInfoModalOpen(false)}>×</button>
            <h3 className="modal-title">Personal Profile Details</h3>
            
            <div className="info-grid">
              <span className="info-label">User ID:</span>
              <span className="info-value">#{currentUser.id}</span>

              <span className="info-label">Full Name:</span>
              <span className="info-value">{currentUser.name}</span>

              <span className="info-label">Username:</span>
              <span className="info-value">{currentUser.username}</span>

              <span className="info-label">Email Address:</span>
              <span className="info-value">{currentUser.email}</span>

              <span className="info-label">Phone:</span>
              <span className="info-value">{currentUser.phone || 'N/A'}</span>

              <span className="info-label">Website:</span>
              <span className="info-value">{currentUser.website || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={() => setInfoModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
