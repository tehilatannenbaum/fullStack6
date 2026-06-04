import express from 'express';
import { Post, Comment } from '../models/index.js';

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
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// PUT update post (only if owned by user)
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const requestUserId = req.headers['x-user-id'];
    if (!requestUserId || parseInt(requestUserId) !== post.userId) {
      return res.status(403).json({ error: 'Unauthorized. You can only edit your own posts.' });
    }

    const { title, body } = req.body;
    await post.update({
      title: title !== undefined ? title : post.title,
      body: body !== undefined ? body : post.body
    });
    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post.' });
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

    await post.destroy();
    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

export default router;
