import express from 'express';
import { User } from '../models/index.js';

const router = express.Router();

// GET all users (supports queries like ?username=shlomo)
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const where = {};
    Object.keys(filters).forEach(key => {
      where[key] = filters[key];
    });

    const users = await User.findAll({ where });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch user by id error:', error);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// POST new user
router.post('/', async (req, res) => {
  try {
    const { name, username, email, phone, website } = req.body;
    if (!name || !username || !email) {
      return res.status(400).json({ error: 'Name, username, and email are required.' });
    }
    const user = await User.create({ name, username, email, phone, website });
    res.status(201).json({ success: true, id: user.id });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const { name, username, email, phone, website } = req.body;
    await user.update({ name, username, email, phone, website });
    res.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await user.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

export default router;
