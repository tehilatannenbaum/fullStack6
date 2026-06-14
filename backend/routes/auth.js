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

export default router;
