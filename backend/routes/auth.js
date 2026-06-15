import express from 'express';
import bcrypt from 'bcryptjs';
import { User, Password } from '../models/index.js';

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, phone, website } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({ error: 'Username, password, name, and email are required.' });
    }

    // Check if username exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Create user
    const user = await User.create({
      name,
      username,
      email,
      phone: phone || null,
      website: website || null,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save password
    await Password.create({
      userId: user.id,
      passwordHash,
    });

    res.status(201).json({
      message: 'Registration successful!',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        website: user.website,
        isAdmin: user.isAdmin,
        isBlocked: user.isBlocked,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userPassword = await Password.findOne({ where: { userId: user.id } });
    if (!userPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, userPassword.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account is blocked. Please contact the administrator.' });
    }

    // Return mock token and public user details
    res.json({
      token: `auth-token-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        website: user.website,
        isAdmin: user.isAdmin,
        isBlocked: user.isBlocked,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Missing x-user-id header.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const userPassword = await Password.findOne({ where: { userId } });
    if (!userPassword) {
      return res.status(404).json({ error: 'User password not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userPassword.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update the password hash
    await userPassword.update({ passwordHash });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
