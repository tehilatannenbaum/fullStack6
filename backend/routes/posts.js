import express from 'express';
import { sequelize, Post, Comment } from '../models/index.js';

const router = express.Router();

// GET all/filtered posts
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const where = {};
    let embedComments = false;

    Object.keys(filters).forEach(key => {
      if (key === '_embed' && filters[key] === 'comments') {
        embedComments = true;
      } else {
        where[key] = filters[key];
      }
    });

    const posts = await Post.findAll({
      where,
      order: [['id', 'ASC']],
      include: embedComments ? [Comment] : []
    });
    res.json(posts);
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// GET single post
router.get('/:id', async (req, res) => {
  try {
    const { _embed } = req.query;
    const include = _embed === 'comments' ? [Comment] : [];

    const post = await Post.findByPk(req.params.id, { include });
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json(post);
  } catch (error) {
    console.error('Fetch post by id error:', error);
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// GET comments for post
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.id }
    });
    res.json(comments);
  } catch (error) {
    console.error('Fetch comments for post error:', error);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// POST new post
router.post('/', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body are required.' });
    }
    const post = await Post.create({ userId, title, body });
    res.status(201).json({ success: true, id: post.id });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// PATCH post (עדכון חלקי ודינמי החוסך תעבורת רשת)
router.patch('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.headers['x-user-id']; // מושך את ה-ID מה-Header בהתאמה לשאר הראוטים שלך

    // 1. מוודאים שהפוסט קיים ושייך למשתמש שמנסה לערוך אותו
    const post = await Post.findOne({ where: { id: postId, userId: userId } });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized.' });
    }

    // 2. מעדכנים רק את השדות שהגיעו ב-req.body
    await post.update(req.body);

    // 3. מחזירים סטטוס הצלחה JSON
    return res.status(204).send();
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({ error: 'Server error while updating post.' });
  }
});

// DELETE post (only if owned by user)
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const requestUserId = req.headers['x-user-id'];
    if (!requestUserId || parseInt(requestUserId) !== post.userId) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete your own posts.' });
    }

    // Perform deletion of comments and post inside a transaction in the correct order
    await sequelize.transaction(async (t) => {
      // 1. Delete all comments associated with this post
      await Comment.destroy({
        where: { postId: post.id },
        transaction: t
      });

      // 2. Delete the post itself
      await post.destroy({ transaction: t });
    });

    res.json({ message: 'Post and its comments deleted successfully.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

export default router;