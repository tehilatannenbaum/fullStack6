import express from 'express';
import { User } from '../models/index.js';

const router = express.Router();

// Middleware to authenticate and authorize admin users only
const adminAuth = async (req, res, next) => {
  const requesterId = req.headers['x-user-id'];
  if (!requesterId) {
    return res.status(401).json({ error: 'Unauthorized. Missing x-user-id header.' });
  }

  try {
    const requester = await User.findByPk(requesterId);
    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized. Requester user not found.' });
    }

    if (!requester.isAdmin) {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    req.adminUser = requester;
    next();
  } catch (error) {
    console.error('Admin Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET all users for admin management
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['id', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Fetch users for admin error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PATCH block user
router.patch('/block/:id', adminAuth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (parseInt(targetUserId) === req.adminUser.id) {
      return res.status(400).json({ error: 'You cannot block yourself.' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.update({ isBlocked: true });
    res.json({ message: 'User blocked successfully.', user });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

// PATCH unblock user
router.patch('/unblock/:id', adminAuth, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.update({ isBlocked: false });
    res.json({ message: 'User unblocked successfully.', user });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user.' });
  }
});

export default router;
