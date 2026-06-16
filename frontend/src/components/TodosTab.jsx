import React, { useState, useEffect } from 'react';

const TodosTab = ({ currentUser }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, completed, pending

  // Edit / Add Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentTodo, setCurrentTodo] = useState({ id: null, title: '', completed: false });
  const [submitting, setSubmitting] = useState(false);



  const userId = currentUser?.id;

  useEffect(() => {
    if (userId) {
      fetchTodos(userId);
    }
  }, [userId]);

  const fetchTodos = async (userId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/todos?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch todos.');
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. תיקון פונקציית סימון ה-V: שולחת אך ורק את השדה completed שהשתנה
  const handleToggleCompleted = async (todo) => {
    try {
      const response = await fetch(`http://localhost:5000/todos/${todo.id}`, {
        method: 'PATCH', // שינוי ל-PATCH חסכוני
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify({ completed: !todo.completed }), // שולחים רק שדה אחד!
      });

      if (!response.ok) throw new Error('Failed to update status.');

      const result = await response.json();

      if (result.success) {
        setTodos(todos.map(t =>
          t.id === todo.id
            ? { ...t, completed: !t.completed }
            : t
        ));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      const response = await fetch(`http://localhost:5000/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete todo.');
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setCurrentTodo({ id: null, title: '', completed: false });
    setModalOpen(true);
  };

  const openEditModal = (todo) => {
    setModalMode('edit');
    setCurrentTodo({ ...todo });
    setModalOpen(true);
  };

  // 2. תיקון פונקציית שמירת מודל העריכה: משווה ומסננת שדות
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!currentTodo.title.trim()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const response = await fetch('http://localhost:5000/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.id,
            title: currentTodo.title.trim(),
            completed: false,
          }),
        });

        if (!response.ok) throw new Error('Failed to create todo.');
        const resData = await response.json();
        const newTodo = {
          id: resData.id,
          userId: currentUser.id,
          title: currentTodo.title.trim(),
          completed: false,
        };
        setTodos([...todos, newTodo]);
      } else {
        // מציאת המשימה המקורית מה-state לפני העריכה בטופס
        const originalTodo = todos.find(t => t.id === currentTodo.id);

        if (!originalTodo) return;

        // בניית האובייקט המצומצם המכיל רק את מה שהשתנה בפועל
        const updatedFields = {};
        if (currentTodo.title.trim() !== originalTodo.title) {
          updatedFields.title = currentTodo.title.trim();
        }
        if (currentTodo.completed !== originalTodo.completed) {
          updatedFields.completed = currentTodo.completed;
        }

        // אופטימיזציה: אם לחצו שמירה בלי לשנות כלום, סוגרים את המודל ללא פנייה לרשת
        if (Object.keys(updatedFields).length === 0) {
          setModalOpen(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/todos/${currentTodo.id}`, {
          method: 'PATCH', // שינוי ל-PATCH חסכוני
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id.toString(),
          },
          body: JSON.stringify(updatedFields), // שולחים רק את השדות שהשתנו!
        });

        if (!response.ok) throw new Error('Failed to update todo.');
        const result = await response.json();

        if (result.success) {
          setTodos(todos.map(t =>
            t.id === currentTodo.id
              ? { ...t, ...updatedFields }
              : t
          ));
        }
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & search computation
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'completed') return matchesSearch && todo.completed;
    if (filter === 'pending') return matchesSearch && !todo.completed;
    return matchesSearch;
  });

  return (
    <div>
      <div className="tab-header">
        <h2 className="tab-title">Your Tasks</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <span>+</span> Add Task
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      <div className="controls-row">
        <div className="search-box">
          <input
            type="text"
            className="form-input"
            placeholder="Search tasks..."
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
            <option value="all">All ({todos.length})</option>
            <option value="completed">Completed ({todos.filter(t => t.completed).length})</option>
            <option value="pending">Pending ({todos.filter(t => !t.completed).length})</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading tasks...
        </div>
      ) : filteredTodos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-panel">
          No tasks found. Try adding a new task!
        </div>
      ) : (
        <div className="todo-list">
          {filteredTodos.map(todo => (
            <div key={todo.id} className="glass-panel todo-item">
              <div className="todo-item-info">
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleCompleted(todo)}
                />
                <span className={`todo-title-text ${todo.completed ? 'completed' : ''}`}>
                  {todo.title}
                </span>
              </div>
              <div className="todo-actions">
                <button
                  className="action-btn btn-edit"
                  onClick={() => openEditModal(todo)}
                  title="Edit task title"
                >
                  ✏️
                </button>
                <button
                  className="action-btn btn-delete"
                  onClick={() => handleDelete(todo.id)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            <h3 className="modal-title">{modalMode === 'add' ? 'Add New Task' : 'Edit Task'}</h3>

            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="todo-title">Task Title</label>
                <input
                  type="text"
                  id="todo-title"
                  className="form-input"
                  placeholder="What needs to be done?"
                  value={currentTodo.title}
                  onChange={(e) => setCurrentTodo({ ...currentTodo, title: e.target.value })}
                  disabled={submitting}
                  required
                  autoFocus
                />
              </div>

              {modalMode === 'edit' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="todo-completed"
                    className="todo-checkbox"
                    checked={currentTodo.completed}
                    onChange={(e) => setCurrentTodo({ ...currentTodo, completed: e.target.checked })}
                    disabled={submitting}
                  />
                  <label className="form-label" htmlFor="todo-completed" style={{ margin: 0, cursor: 'pointer' }}>
                    Mark as completed
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !currentTodo.title.trim()}
                >
                  {submitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodosTab;