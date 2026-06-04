import express from 'express';
import { Todo } from '../models/index.js';

const router = express.Router();

// GET all/filtered todos
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const where = {};
    
    Object.keys(filters).forEach(key => {
      if (key === 'completed') {
        where[key] = filters[key] === 'true';
      } else {
        where[key] = filters[key];
      }
    });

    const todos = await Todo.findAll({
      where,
      order: [['id', 'ASC']]
    });
    res.json(todos);
  } catch (error) {
    console.error('Fetch todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos.' });
  }
});

// GET single todo
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found.' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Fetch todo error:', error);
    res.status(500).json({ error: 'Failed to fetch todo.' });
  }
});

// POST new todo
router.post('/', async (req, res) => {
  try {
    const { userId, title, completed } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required.' });
    }
    const todo = await Todo.create({
      userId,
      title,
      completed: completed || false
    });
    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo.' });
  }
});

// PUT update todo
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found.' });
    }
    const { title, completed, userId } = req.body;
    await todo.update({
      title: title !== undefined ? title : todo.title,
      completed: completed !== undefined ? completed : todo.completed,
      userId: userId !== undefined ? userId : todo.userId
    });
    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo.' });
  }
});

// DELETE todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByPk(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found.' });
    }
    await todo.destroy();
    res.json({ message: 'Todo deleted successfully.' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo.' });
  }
});

export default router;
