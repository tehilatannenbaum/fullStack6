import React, { useState, useEffect } from 'react';

const PostsTab = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [commentsMap, setCommentsMap] = useState({}); // { postId: [comments] }
  const [expandedPosts, setExpandedPosts] = useState({}); // { postId: boolean }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' מציג את כולם, 'mine' מציג רק את שלי

  // Post Modal state
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalMode, setPostModalMode] = useState('add'); // add, edit
  const [currentPost, setCurrentPost] = useState({ id: null, title: '', body: '' });
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Comment Modal/Form state
  const [newCommentsText, setNewCommentsText] = useState({}); // { postId: commentBody }
  const [editingComment, setEditingComment] = useState(null); // { id, body, name }
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // אופטימיזציה: טוענים את הפוסטים פעם אחת בלבד בעת טעינת הרכיב (ולא בכל שינוי פילטר)
  useEffect(() => {
    fetchPosts();
  }, [currentUser]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      // תמיד מביאים את כל הפוסטים של כולם כדי שנוכל לסנן אותם מקומית בזיכרון של React
      const response = await fetch('http://localhost:5000/posts');
      if (!response.ok) throw new Error('Failed to fetch posts.');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForPost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments.');
      const data = await response.json();
      setCommentsMap(prev => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !!expandedPosts[postId];
    if (!isExpanded && !commentsMap[postId]) {
      await fetchCommentsForPost(postId);
    }
    setExpandedPosts(prev => ({ ...prev, [postId]: !isExpanded }));
  };

  // Posts CRUD
  const handlePostDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString(),
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete post.');
      }
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddPostModal = () => {
    setPostModalMode('add');
    setCurrentPost({ id: null, title: '', body: '' });
    setPostModalOpen(true);
  };

  const openEditPostModal = (post) => {
    setPostModalMode('edit');
    setCurrentPost({ ...post });
    setPostModalOpen(true);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!currentPost.title.trim() || !currentPost.body.trim()) return;

    setPostSubmitting(true);
    try {
      if (postModalOpen && postModalMode === 'add') {
        const response = await fetch('http://localhost:5000/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            title: currentPost.title,
            body: currentPost.body,
          }),
        });
        if (!response.ok) throw new Error('Failed to create post.');
        const newPost = await response.json();
        setPosts([...posts, newPost]);
        setPostModalOpen(false);
      } else {
        const originalPost = posts.find(p => p.id === currentPost.id);
        if (!originalPost) return;

        const updatedFields = {};
        if (currentPost.title.trim() !== originalPost.title) {
          updatedFields.title = currentPost.title.trim();
        }
        if (currentPost.body.trim() !== originalPost.body) {
          updatedFields.body = currentPost.body.trim();
        }

        if (Object.keys(updatedFields).length === 0) {
          setPostModalOpen(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/posts/${currentPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update post.');
      }

      // עדכון ה-state המקומי ב-React ללא תלות בתשובת השרת (כי קיבלנו רק 204)
      setPosts(posts.map(p => 
        p.id === currentPost.id ? { ...p, ...updatedFields } : p
      ));
      setPostModalOpen(false);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setPostSubmitting(false); 
    }
  };

  // Comments CRUD
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentBody = newCommentsText[postId];
    if (!commentBody || !commentBody.trim()) return;

    setCommentSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          name: currentUser.name,
          email: currentUser.email,
          body: commentBody,
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment.');
      const newComment = await response.json();
      
      const existingComments = commentsMap[postId] || [];
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...existingComments, newComment]
      }));
      setNewCommentsText(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`http://localhost:5000/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.id.toString(),
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete comment.');
      }

      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditComment = (comment) => {
    setEditingComment({ ...comment });
  };

  const handleEditCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!editingComment.body.trim()) return;

    setCommentSubmitting(true);
    try {
      const originalComment = (commentsMap[postId] || []).find(c => c.id === editingComment.id);
      if (!originalComment) return;

      const updatedFields = {};
      if (editingComment.name && editingComment.name.trim() !== originalComment.name) {
        updatedFields.name = editingComment.name.trim();
      }
      if (editingComment.body && editingComment.body.trim() !== originalComment.body) {
        updatedFields.body = editingComment.body.trim();
      }

      if (Object.keys(updatedFields).length === 0) {
        setEditingComment(null);
        return;
      }

      // שליחת בקשת PATCH לשרת ללא צפייה לתגובת JSON
      const response = await fetch(`http://localhost:5000/comments/${editingComment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update comment.');
      }

      // עדכון ה-state המקומי ב-React ללא תלות בתשובת השרת
      setCommentsMap(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c => 
          c.id === editingComment.id ? { ...c, ...updatedFields } : c
        )
      }));
      
      setEditingComment(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // אופטימיזציה קריטית: סינון מקומי כפול וחכם בזיכרון של הדפדפן ללא בקשות רשת מיותרות!
  const filteredPosts = posts.filter(post => {
    // 1. סינון ראשון: לפי מצב התצוגה (כל הפוסטים או רק הפוסטים שלי)
    if (viewMode === 'mine' && post.userId !== currentUser.id) {
      return false;
    }
    
    // 2. סינון שני: לפי מילות החיפוש שהוזנו בתיבה
    const matchesSearch = 
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.body.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">
          {viewMode === 'mine' ? 'My Posts' : 'All Posts'}
        </h2>
        <button className="btn btn-primary" onClick={openAddPostModal}>
          <span>+</span> Add Post
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      <div className="controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* כפתורי הסינון החדשים והחסכוניים ברשת */}
        <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button"
            className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setViewMode('all')}
          >
            All Posts
          </button>
          <button 
            type="button"
            className={`btn ${viewMode === 'mine' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setViewMode('mine')}
          >
            My Posts
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading posts...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-panel">
          No posts found. Write a new post to get started!
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map(post => {
            const isExpanded = !!expandedPosts[post.id];
            const postComments = commentsMap[post.id] || [];

            return (
              <div key={post.id} className="glass-panel post-card">
                <div className="post-card-header">
                  <h3 className="post-title">{post.title}</h3>
                  {post.userId === currentUser.id && (
                    <div className="todo-actions">
                      <button
                        className="action-btn btn-edit"
                        onClick={() => openEditPostModal(post)}
                        title="Edit post"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn btn-delete"
                        onClick={() => handlePostDelete(post.id)}
                        title="Delete post"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="post-body">{post.body}</p>
                
                <div className="post-footer">
                  <button
                    className="comments-toggle"
                    onClick={() => toggleComments(post.id)}
                  >
                    💬 {isExpanded ? 'Hide Comments' : `Show Comments`}
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Post ID: #{post.id} {post.userId === currentUser.id ? '(Your Post)' : `(By User #${post.userId})`}
                  </span>
                </div>

                {isExpanded && (
                  <div className="comments-section">
                    <h4 className="comments-title">
                      Comments ({postComments.length})
                    </h4>
                    
                    <div className="comment-list" style={{ marginBottom: '1.5rem' }}>
                      {postComments.map(comment => {
                        const isCommentOwner = comment.email === currentUser.email || post.userId === currentUser.id;
                        const isEditingThis = editingComment && editingComment.id === comment.id;

                        return (
                          <div key={comment.id} className="comment-item">
                            {isEditingThis ? (
                              <form onSubmit={(e) => handleEditCommentSubmit(e, post.id)}>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={editingComment.name}
                                    onChange={(e) => setEditingComment({ ...editingComment, name: e.target.value })}
                                    placeholder="Commenter Name"
                                    required
                                    disabled={commentSubmitting}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                  <textarea
                                    className="form-input"
                                    value={editingComment.body}
                                    onChange={(e) => setEditingComment({ ...editingComment, body: e.target.value })}
                                    rows="2"
                                    required
                                    disabled={commentSubmitting}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    onClick={() => setEditingComment(null)}
                                    disabled={commentSubmitting}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                    disabled={commentSubmitting}
                                  >
                                    Save
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <div className="comment-header">
                                  <span className="comment-name">{comment.name}</span>
                                  <span className="comment-email">{comment.email}</span>
                                </div>
                                <p className="comment-body">{comment.body}</p>
                                
                                {isCommentOwner && (
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button
                                      className="action-btn btn-edit"
                                      onClick={() => startEditComment(comment)}
                                      title="Edit comment"
                                      style={{ padding: '0.2rem' }}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="action-btn btn-delete"
                                      onClick={() => handleCommentDelete(post.id, comment.id)}
                                      title="Delete comment"
                                      style={{ padding: '0.2rem' }}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(e, post.id)}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <textarea
                          className="form-input"
                          placeholder="Write a comment..."
                          rows="2"
                          value={newCommentsText[post.id] || ''}
                          onChange={(e) => setNewCommentsText({ ...newCommentsText, [post.id]: e.target.value })}
                          required
                          disabled={commentSubmitting}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-secondary"
                        style={{ width: '100%', fontSize: '0.9rem' }}
                        disabled={commentSubmitting || !(newCommentsText[post.id] || '').trim()}
                      >
                        {commentSubmitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Post Modal */}
      {postModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setPostModalOpen(false)}>×</button>
            <h3 className="modal-title">{postModalMode === 'add' ? 'Create New Post' : 'Edit Post'}</h3>
            
            <form onSubmit={handlePostSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="post-title">Title</label>
                <input
                  type="text"
                  id="post-title"
                  className="form-input"
                  placeholder="Enter post title"
                  value={currentPost.title}
                  onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                  disabled={postSubmitting}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label" htmlFor="post-body">Content</label>
                <textarea
                  id="post-body"
                  className="form-input"
                  placeholder="Write your post details here..."
                  value={currentPost.body}
                  onChange={(e) => setCurrentPost({ ...currentPost, body: e.target.value })}
                  disabled={postSubmitting}
                  rows="5"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPostModalOpen(false)}
                  disabled={postSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={postSubmitting || !currentPost.title.trim() || !currentPost.body.trim()}
                >
                  {postSubmitting ? 'Saving...' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsTab;