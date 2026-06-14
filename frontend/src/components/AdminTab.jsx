import React, { useState, useEffect } from 'react';

const AdminTab = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, blocked

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/admin/users', {
        headers: {
          'x-user-id': currentUser.id.toString(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users. Admin access required.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user) => {
    const isCurrentlyBlocked = user.isBlocked;
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    
    if (user.id === currentUser.id) {
      alert('You cannot block yourself.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/admin/${action}/${user.id}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': currentUser.id.toString(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} user.`);
      }

      const result = await response.json();
      
      // Update state
      setUsers(users.map(u => u.id === user.id ? { ...u, isBlocked: !isCurrentlyBlocked } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter & Search
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    if (filter === 'blocked') return matchesSearch && user.isBlocked;
    if (filter === 'active') return matchesSearch && !user.isBlocked;
    return matchesSearch;
  });

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">🛡️ User Access Control</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          As an Admin, you can block or unblock users. Blocked users cannot log in.
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      <div className="controls-row">
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Users ({users.length})</option>
            <option value="active">Active ({users.filter(u => !u.isBlocked).length})</option>
            <option value="blocked">Blocked ({users.filter(u => u.isBlocked).length})</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading user database...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-panel">
          No users found matching your filters.
        </div>
      ) : (
        <div className="admin-user-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginTop: '1rem'
        }}>
          {filteredUsers.map(user => {
            const isSelf = user.id === currentUser.id;
            return (
              <div 
                key={user.id} 
                className="glass-panel admin-user-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderLeft: user.isBlocked 
                    ? '4px solid var(--color-accent)' 
                    : user.isAdmin 
                      ? '4px solid var(--color-warning)' 
                      : '1px solid var(--panel-border)',
                  position: 'relative'
                }}
              >
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: user.isBlocked 
                      ? 'rgba(244, 63, 94, 0.1)' 
                      : user.isAdmin 
                        ? 'rgba(245, 158, 11, 0.1)' 
                        : 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: user.isBlocked 
                      ? 'var(--color-accent)' 
                      : user.isAdmin 
                        ? 'var(--color-warning)' 
                        : 'var(--color-primary)'
                  }}>
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>
                      {user.name} {isSelf && <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>(You)</span>}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      @{user.username}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>📧 {user.email}</div>
                  <div>📞 {user.phone || 'N/A'}</div>
                  <div>🌐 {user.website || 'N/A'}</div>
                </div>

                {/* Badges Section */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {user.isAdmin ? (
                    <span style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--color-warning)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      👑 Admin
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--color-primary)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      👤 User
                    </span>
                  )}

                  {user.isBlocked ? (
                    <span style={{
                      backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      color: 'var(--color-accent)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid rgba(244, 63, 94, 0.3)'
                    }}>
                      🚫 Blocked
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--color-success)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      ✅ Active
                    </span>
                  )}
                </div>

                {/* Actions Section */}
                <div style={{ marginTop: 'auto', paddingTop: '0.8rem', borderTop: '1px solid rgba(15, 23, 42, 0.05)' }}>
                  <button
                    className={`btn ${user.isBlocked ? 'btn-success' : 'btn-danger'}`}
                    style={{ 
                      width: '100%',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      backgroundColor: isSelf 
                        ? 'rgba(15, 23, 42, 0.1)' 
                        : user.isBlocked 
                          ? 'var(--color-success)' 
                          : 'var(--color-accent)',
                      color: isSelf ? 'rgba(15, 23, 42, 0.4)' : '#fff',
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                      border: 'none',
                      opacity: isSelf ? 0.6 : 1
                    }}
                    onClick={() => handleToggleBlock(user)}
                    disabled={isSelf}
                  >
                    {user.isBlocked ? '🔓 Unblock User' : '🚫 Block User'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTab;
