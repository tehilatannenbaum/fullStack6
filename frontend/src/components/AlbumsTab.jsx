import React, { useState, useEffect } from 'react';

const AlbumsTab = ({ currentUser }) => {
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [albumsError, setAlbumsError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'mine'

  // Selected Album for showing photos
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photosStart, setPhotosStart] = useState(0);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const PHOTOS_LIMIT = 6;

  // Album Modal state
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [albumModalMode, setAlbumModalMode] = useState('add'); // add, edit
  const [currentAlbum, setCurrentAlbum] = useState({ id: null, title: '' });
  const [albumSubmitting, setAlbumSubmitting] = useState(false);

  // Photo Modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalMode, setPhotoModalMode] = useState('add'); // add, edit
  const [currentPhoto, setCurrentPhoto] = useState({ id: null, title: '', url: '' });
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  const getPlaceholderUrl = (photo) => {
    let color = 'cbd5e1'; // default soft gray
    if (photo.url && photo.url.includes('via.placeholder.com')) {
      const parts = photo.url.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && /^[0-9a-fA-F]{6}$/.test(lastPart)) {
        color = lastPart;
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="#${color}"/><text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="20" fill="#ffffff" dominant-baseline="middle" text-anchor="middle">Photo #${photo.id}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  useEffect(() => {
    fetchAlbums();
  }, [currentUser]);

  // Fetch all albums from backend
  const fetchAlbums = async () => {
    setLoadingAlbums(true);
    setAlbumsError('');
    try {
      const response = await fetch(`http://localhost:5000/albums`);
      if (!response.ok) throw new Error('Failed to fetch albums.');
      const data = await response.json();
      setAlbums(data);
    } catch (err) {
      setAlbumsError(err.message);
    } finally {
      setLoadingAlbums(false);
    }
  };

  // Fetch photos for selected album (supports loading in stages)
  const fetchPhotos = async (albumId, startFrom = 0, append = false) => {
    setLoadingPhotos(true);
    try {
      const response = await fetch(`http://localhost:5000/albums/${albumId}/photos?_limit=${PHOTOS_LIMIT}&_start=${startFrom}`);
      if (!response.ok) throw new Error('Failed to fetch photos.');
      const data = await response.json();

      if (append) {
        setPhotos(prev => [...prev, ...data]);
      } else {
        setPhotos(data);
      }

      // If we loaded fewer photos than the limit, we know there are no more photos to load
      setHasMorePhotos(data.length === PHOTOS_LIMIT);
      setPhotosStart(startFrom + data.length);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Select/Unselect Album
  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album);
    setPhotos([]);
    setPhotosStart(0);
    setHasMorePhotos(true);
    fetchPhotos(album.id, 0, false);
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setPhotos([]);
    fetchAlbums(); // refresh list
  };

  // Load More Photos
  const handleLoadMorePhotos = () => {
    if (selectedAlbum) {
      fetchPhotos(selectedAlbum.id, photosStart, true);
    }
  };

  // Album CRUD operations
  const openAddAlbumModal = () => {
    setAlbumModalMode('add');
    setCurrentAlbum({ id: null, title: '' });
    setAlbumModalOpen(true);
  };

  const openEditAlbumModal = (album, e) => {
    e.stopPropagation(); // prevent opening photos view
    setAlbumModalMode('edit');
    setCurrentAlbum({ id: album.id, title: album.title });
    setAlbumModalOpen(true);
  };

  const handleAlbumDelete = async (albumId, e) => {
    e.stopPropagation(); // prevent opening photos view
    if (!window.confirm('Are you sure you want to delete this album? This will also delete all photos in it.')) return;
    try {
      const response = await fetch(`http://localhost:5000/albums/${albumId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString(),
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete album.');
      }
      setAlbums(albums.filter(a => a.id !== albumId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAlbumSubmit = async (e) => {
    e.preventDefault();
    if (!currentAlbum.title.trim()) return;

    setAlbumSubmitting(true);
    try {
      if (albumModalMode === 'add') {
        const response = await fetch('http://localhost:5000/albums', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            title: currentAlbum.title.trim(),
          }),
        });
        if (!response.ok) throw new Error('Failed to create album.');
        const newAlbum = await response.json();
        setAlbums([...albums, newAlbum]);
      } else {
        const originalAlbum = albums.find(a => a.id === currentAlbum.id);
        if (originalAlbum && originalAlbum.title === currentAlbum.title.trim()) {
          setAlbumModalOpen(false);
          return;
        }
        const response = await fetch(`http://localhost:5000/albums/${currentAlbum.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id.toString(),
          },
          body: JSON.stringify({
            title: currentAlbum.title.trim(),
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to update album.');
        }
        setAlbums(albums.map(a => a.id === currentAlbum.id ? { ...a, title: currentAlbum.title.trim() } : a));
      }
      setAlbumModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setAlbumSubmitting(false);
    }
  };

  // Photo CRUD operations
  const openAddPhotoModal = () => {
    setPhotoModalMode('add');
    setCurrentPhoto({ id: null, title: '', url: 'https://picsum.photos/600/600' });
    setPhotoModalOpen(true);
  };

  const openEditPhotoModal = (photo) => {
    setPhotoModalMode('edit');
    setCurrentPhoto({ ...photo });
    setPhotoModalOpen(true);
  };

  const handlePhotoDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      const response = await fetch(`http://localhost:5000/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString(),
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete photo.');
      }
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!currentPhoto.title.trim() || !currentPhoto.url.trim()) return;

    setPhotoSubmitting(true);
    try {
      if (photoModalMode === 'add') {
        const response = await fetch('http://localhost:5000/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id.toString(),
          },
          body: JSON.stringify({
            albumId: selectedAlbum.id,
            title: currentPhoto.title.trim(),
            url: currentPhoto.url.trim()
          }),
        });
        if (!response.ok) throw new Error('Failed to add photo.');
        const newPhoto = await response.json();
        setPhotos([...photos, newPhoto]);
      } else {
        const originalPhoto = photos.find(p => p.id === currentPhoto.id);
        if (!originalPhoto) return;

        const updatedFields = {};
        if (currentPhoto.title.trim() !== originalPhoto.title) {
          updatedFields.title = currentPhoto.title.trim();
        }
        if (currentPhoto.url.trim() !== originalPhoto.url) {
          updatedFields.url = currentPhoto.url.trim();
        }
        if (Object.keys(updatedFields).length === 0) {
          setPhotoModalOpen(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/photos/${currentPhoto.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id.toString(),
          },
          body: JSON.stringify(updatedFields),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to update photo.');
        }
        setPhotos(photos.map(p => p.id === currentPhoto.id ? { ...p, ...updatedFields } : p));
      }
      setPhotoModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setPhotoSubmitting(false);
    }
  };

  // Filter Albums locally
  const filteredAlbums = albums.filter(album => {
    // 1. Filter by viewMode (All vs Mine)
    if (viewMode === 'mine' && album.userId !== currentUser.id) {
      return false;
    }

    // 2. Filter by search (title or ID)
    const term = search.toLowerCase();
    const matchesTitle = album.title.toLowerCase().includes(term);
    const matchesId = album.id.toString() === term;
    return term === '' || matchesTitle || matchesId;
  });

  // SUB-VIEW: Photos Listing
  if (selectedAlbum) {
    return (
      <div>
        <div className="tab-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={handleBackToAlbums} style={{ padding: '0.5rem 1rem' }}>
              ← Back
            </button>
            <h2 className="tab-title">{selectedAlbum.title}</h2>
          </div>
          {selectedAlbum.userId === currentUser.id && (
            <button className="btn btn-primary" onClick={openAddPhotoModal}>
              <span>+</span> Add Photo
            </button>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Album ID: #{selectedAlbum.id} | Active Photos: {photos.length}
        </div>

        {photos.length === 0 && !loadingPhotos ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-panel">
            No photos in this album. Add your first photo!
          </div>
        ) : (
          <div>
            {/* Photos Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {photos.map(photo => (
                <div key={photo.id} className="glass-panel" style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  overflow: 'hidden'
                }}>
                  {/* Photo Image */}
                  <div style={{
                    width: '100%',
                    height: '150px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={photo.url && photo.url.includes('via.placeholder.com') ? getPlaceholderUrl(photo) : photo.url}
                      alt={photo.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform var(--transition-normal)'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getPlaceholderUrl(photo);
                      }}
                    />
                  </div>

                  {/* Photo Title */}
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    minHeight: '2.7em',
                    lineHeight: '1.35',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {photo.title}
                  </div>

                  {/* Photo Footer with Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    borderTop: '1px solid rgba(15, 23, 42, 0.05)',
                    paddingTop: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Photo #{photo.id}
                    </span>
                    {selectedAlbum.userId === currentUser.id && (
                      <div className="todo-actions">
                        <button
                          className="action-btn btn-edit"
                          onClick={() => openEditPhotoModal(photo)}
                          title="Edit Photo"
                          style={{ padding: '0.2rem' }}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn btn-delete"
                          onClick={() => handlePhotoDelete(photo.id)}
                          title="Delete Photo"
                          style={{ padding: '0.2rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMorePhotos && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleLoadMorePhotos}
                  disabled={loadingPhotos}
                  style={{ width: '200px' }}
                >
                  {loadingPhotos ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {loadingPhotos && !hasMorePhotos && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading photos...</div>
            )}
          </div>
        )}

        {/* Add/Edit Photo Modal */}
        {photoModalOpen && (
          <div className="modal-overlay">
            <div className="glass-panel modal-content">
              <button className="modal-close" onClick={() => setPhotoModalOpen(false)}>×</button>
              <h3 className="modal-title">{photoModalMode === 'add' ? 'Add Photo' : 'Edit Photo'}</h3>

              <form onSubmit={handlePhotoSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="photo-title">Photo Title</label>
                  <input
                    type="text"
                    id="photo-title"
                    className="form-input"
                    value={currentPhoto.title}
                    onChange={(e) => setCurrentPhoto({ ...currentPhoto, title: e.target.value })}
                    disabled={photoSubmitting}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label" htmlFor="photo-url">Image URL</label>
                  <input
                    type="url"
                    id="photo-url"
                    className="form-input"
                    value={currentPhoto.url}
                    onChange={(e) => setCurrentPhoto({ ...currentPhoto, url: e.target.value })}
                    disabled={photoSubmitting}
                    required
                  />
                </div>



                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setPhotoModalOpen(false)} disabled={photoSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={photoSubmitting || !currentPhoto.title.trim() || !currentPhoto.url.trim()}>
                    {photoSubmitting ? 'Saving...' : 'Save Photo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SUB-VIEW: Albums List (Default)
  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">
          {viewMode === 'mine' ? 'My Albums' : 'All Albums'}
        </h2>
        <button className="btn btn-primary" onClick={openAddAlbumModal}>
          <span>+</span> Add Album
        </button>
      </div>

      {albumsError && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠️ {albumsError}</div>}

      <div className="controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search albums by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setViewMode('all')}
          >
            All Albums
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'mine' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setViewMode('mine')}
          >
            My Albums
          </button>
        </div>
      </div>

      {loadingAlbums ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading albums...
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-panel">
          No albums found. Add a new album to start compiling photos!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredAlbums.map(album => (
            <div
              key={album.id}
              className="glass-panel"
              onClick={() => handleSelectAlbum(album)}
              style={{
                padding: '2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }}
            >
              {album.userId === currentUser.id && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  <button
                    className="action-btn btn-edit"
                    onClick={(e) => openEditAlbumModal(album, e)}
                    title="Edit Album Title"
                    style={{ padding: '0.25rem' }}
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn btn-delete"
                    onClick={(e) => handleAlbumDelete(album.id, e)}
                    title="Delete Album"
                    style={{ padding: '0.25rem' }}
                  >
                    🗑️
                  </button>
                </div>
              )}

              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                ALBUM ID: #{album.id} {album.userId === currentUser.id ? '(Your Album)' : `(By User #${album.userId})`}
              </div>

              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: '1.3',
                marginRight: album.userId === currentUser.id ? '2.5rem' : '0rem' // give space for floating actions if visible
              }}>
                📁 {album.title}
              </h3>

              <div style={{
                marginTop: 'auto',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>Open Photos</span>
                <span>➔</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Album Modal */}
      {albumModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setAlbumModalOpen(false)}>×</button>
            <h3 className="modal-title">{albumModalMode === 'add' ? 'Add New Album' : 'Edit Album Title'}</h3>

            <form onSubmit={handleAlbumSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="album-title">Album Title</label>
                <input
                  type="text"
                  id="album-title"
                  className="form-input"
                  placeholder="Enter album title"
                  value={currentAlbum.title}
                  onChange={(e) => setCurrentAlbum({ ...currentAlbum, title: e.target.value })}
                  disabled={albumSubmitting}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAlbumModalOpen(false)} disabled={albumSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={albumSubmitting || !currentAlbum.title.trim()}>
                  {albumSubmitting ? 'Saving...' : 'Save Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumsTab;
