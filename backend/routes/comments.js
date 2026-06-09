import express from 'express';
import { Comment, Post, User } from '../models/index.js';

const router = express.Router();

// GET all/filtered comments
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const where = {};
    Object.keys(filters).forEach(key => {
      where[key] = filters[key];
    });

    const comments = await Comment.findAll({
      where,
      order: [['id', 'ASC']]
    });
    res.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// GET single comment
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    res.json(comment);
  } catch (error) {
    console.error('Fetch comment by id error:', error);
    res.status(500).json({ error: 'Failed to fetch comment.' });
  }
});

// POST new comment
router.post('/', async (req, res) => {
  try {
    const { postId, name, email, body } = req.body;
    if (!postId || !name || !email || !body) {
      return res.status(400).json({ error: 'postId, name, email, and body are required.' });
    }
    const comment = await Comment.create({ postId, name, email, body });
    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment.' });
  }
});

// PUT update comment
//router.put('/:id', async (req, res) => {
//  try {
//    const comment = await Comment.findByPk(req.params.id);
//    if (!comment) {
//      return res.status(404).json({ error: 'Comment not found.' });
//    }
//
//    const requestUserId = req.headers['x-user-id'];
//    if (!requestUserId) {
//      return res.status(403).json({ error: 'Unauthorized. Missing x-user-id header.' });
//    }
//
//    const user = await User.findByPk(requestUserId);
//    if (!user) {
//      return res.status(403).json({ error: 'Unauthorized. User not found.' });
//    }
//
//    const post = await Post.findByPk(comment.postId);
//
//    if (comment.email !== user.email && (!post || post.userId !== user.id)) {
//      return res.status(403).json({ error: 'Unauthorized. You can only edit comments on your posts or comments you created.' });
//    }
//
//    const { name, body } = req.body;
//    await comment.update({
//      name: name !== undefined ? name : comment.name,
//      body: body !== undefined ? body : comment.body
//    });
//    res.json(comment);
//  } catch (error) {
//    console.error('Update comment error:', error);
//    res.status(500).json({ error: 'Failed to update comment.' });
//  }
//});

// backend/routes/comments.js

// שינוי ל-PATCH עבור עדכון חלקי של שדות התגובה
router.patch('/:id', async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.headers['x-user-id']; // מזהה המשתמש מה-Header

    // 1. מוצאים את התגובה בבסיס הנתונים
    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // הערה: אם יש לך הגבלה שרק יוצר התגובה או בעל הפוסט יכולים לערוך, 
    // זה המקום להוסיף בדיקת הרשאה (למשל: if (comment.userId !== userId) ... )

    // 2. מעדכנים דינמית ב-MySQL רק את השדות שהגיעו ב-req.body (למשל רק את ה-body)
    await comment.update(req.body);

    // 3. מחזירים את התגובה המעודכנת המלאה בפורמט JSON
    return res.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return res.status(500).json({ error: 'Server error while updating comment.' });
  }
});

// DELETE comment
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const requestUserId = req.headers['x-user-id'];
    if (!requestUserId) {
      return res.status(403).json({ error: 'Unauthorized. Missing x-user-id header.' });
    }

    const user = await User.findByPk(requestUserId);
    if (!user) {
      return res.status(403).json({ error: 'Unauthorized. User not found.' });
    }

    const post = await Post.findByPk(comment.postId);

    if (comment.email !== user.email && (!post || post.userId !== user.id)) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete comments on your posts or comments you created.' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

export default router;
