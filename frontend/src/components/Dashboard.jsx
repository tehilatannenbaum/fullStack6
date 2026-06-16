import React, { useState, useEffect } from 'react';
import TodosTab from './TodosTab.jsx';
import PostsTab from './PostsTab.jsx';
import AlbumsTab from './AlbumsTab.jsx';
import AdminTab from './AdminTab.jsx';

const Dashboard = ({ currentUser, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('todos'); // todos, posts, albums
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    website: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sync profile edit form when modal opens or currentUser changes
  useEffect(() => {
    if (infoModalOpen) {
      setEditForm({
        name: currentUser.name || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        website: currentUser.website || ''
      });
      setIsEditingProfile(false);
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [infoModalOpen, currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.username.trim() || !editForm.email.trim()) {
      alert('Full Name, Username, and Email Address are required.');
      return;
    }
    setProfileSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          username: editForm.username.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          website: editForm.website.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile.');
      }

      const result = await response.json();

      if (result.success) {
        onUserUpdate({
          ...currentUser,
          name: editForm.name.trim(),
          username: editForm.username.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          website: editForm.website.trim()
        });
      }
      setIsEditingProfile(false);
      alert('Profile updated successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('All fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetch('http://localhost:5000/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to change password.');
      }

      alert('Password changed successfully.');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

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
      } else if (hash.endsWith('/admin') && currentUser.isAdmin) {
        setActiveTab('admin');
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
          {currentUser.isAdmin && (
            <button
              className={`sidebar-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              🛡️ Admin Panel
            </button>
          )}
        </aside>

        <main className="main-content">
          {activeTab === 'todos' && <TodosTab currentUser={currentUser} />}
          {activeTab === 'posts' && <PostsTab currentUser={currentUser} />}
          {activeTab === 'albums' && <AlbumsTab currentUser={currentUser} />}
          {activeTab === 'admin' && currentUser.isAdmin && <AdminTab currentUser={currentUser} />}
        </main>
      </div>

      {/* Profile Details Modal */}
      {infoModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setInfoModalOpen(false)}>×</button>
            <h3 className="modal-title">
              {isChangingPassword
                ? '🔑 Change Password'
                : isEditingProfile
                  ? '✏️ Edit Personal Profile'
                  : '👤 Personal Profile Details'}
            </h3>

            {!isEditingProfile && !isChangingPassword ? (
              <>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setIsEditingProfile(true)}>
                      ✏️ Edit Profile
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsChangingPassword(true)}>
                      🔑 Change Password
                    </button>
                  </div>
                  <button className="btn btn-primary" onClick={() => setInfoModalOpen(false)}>
                    Close
                  </button>
                </div>
              </>
            ) : isChangingPassword ? (
              <form onSubmit={handlePasswordSubmit}>
                <div className="info-grid">
                  <label className="info-label" htmlFor="current-password">Current Password:</label>
                  <input
                    id="current-password"
                    type="password"
                    className="form-input"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />

                  <label className="info-label" htmlFor="new-password">New Password:</label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />

                  <label className="info-label" htmlFor="confirm-password">Confirm New Password:</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsChangingPassword(false)}
                    disabled={passwordSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                    {passwordSaving ? 'Saving...' : 'Change Password'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                <div className="info-grid">
                  <span className="info-label">User ID:</span>
                  <span className="info-value">#{currentUser.id} (read-only)</span>

                  <label className="info-label" htmlFor="profile-name">Full Name:</label>
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />

                  <label className="info-label" htmlFor="profile-username">Username:</label>
                  <input
                    id="profile-username"
                    type="text"
                    className="form-input"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    required
                  />

                  <label className="info-label" htmlFor="profile-email">Email Address:</label>
                  <input
                    id="profile-email"
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />

                  <label className="info-label" htmlFor="profile-phone">Phone:</label>
                  <input
                    id="profile-phone"
                    type="text"
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />

                  <label className="info-label" htmlFor="profile-website">Website:</label>
                  <input
                    id="profile-website"
                    type="text"
                    className="form-input"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditingProfile(false)}
                    disabled={profileSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
