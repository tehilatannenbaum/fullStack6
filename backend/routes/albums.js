import express from 'express';
import { sequelize, Album, Photo } from '../models/index.js';

const router = express.Router();

// GET all/filtered albums
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const where = {};
    Object.keys(filters).forEach(key => {
      where[key] = filters[key];
    });

    const albums = await Album.findAll({
      where,
      order: [['id', 'ASC']]
    });
    res.json(albums);
  } catch (error) {
    console.error('Fetch albums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums.' });
  }
});

// GET single album
router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found.' });
    }
    res.json(album);
  } catch (error) {
    console.error('Fetch album error:', error);
    res.status(500).json({ error: 'Failed to fetch album.' });
  }
});

// GET photos for an album (supports _limit and _start pagination)
router.get('/:id/photos', async (req, res) => {
  try {
    const albumId = req.params.id;
    const limit = req.query._limit ? parseInt(req.query._limit) : undefined;
    const start = req.query._start ? parseInt(req.query._start) : 0;

    const photos = await Photo.findAll({
      where: { albumId },
      limit: limit,
      offset: start,
      order: [['id', 'ASC']]
    });
    res.json(photos);
  } catch (error) {
    console.error('Fetch album photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos.' });
  }
});

// POST create a new album
router.post('/', async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required.' });
    }
    const album = await Album.create({ userId, title });
    res.status(201).json({ success: true, id: album.id });
  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ error: 'Failed to create album.' });
  }
});

// PATCH update album (ownership checked)
router.patch('/:id', async (req, res) => {
  try {
    const albumId = req.params.id;
    const userId = req.headers['x-user-id'];

    const album = await Album.findOne({ where: { id: albumId, userId } });
    if (!album) {
      return res.status(404).json({ error: 'Album not found or unauthorized.' });
    }

    await album.update(req.body);
    res.status(200).json({ success: true, id: album.id });
  } catch (error) {
    console.error('Update album error:', error);
    res.status(500).json({ error: 'Failed to update album.' });
  }
});

// DELETE album (ownership checked)
router.delete('/:id', async (req, res) => {
  try {
    const albumId = req.params.id;
    const userId = req.headers['x-user-id'];

    const album = await Album.findOne({ where: { id: albumId, userId } });
    if (!album) {
      return res.status(404).json({ error: 'Album not found or unauthorized.' });
    }

    // Perform deletion of photos and album inside a transaction in the correct order
    await sequelize.transaction(async (t) => {
      // 1. Delete all photos associated with this album
      await Photo.destroy({
        where: { albumId: album.id },
        transaction: t
      });

      // 2. Delete the album itself
      await album.destroy({ transaction: t });
    });

    res.json({ message: 'Album and its photos deleted successfully.' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Failed to delete album.' });
  }
});

export default router;
