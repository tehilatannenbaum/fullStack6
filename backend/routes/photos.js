import express from 'express';
import { Photo, Album } from '../models/index.js';

const router = express.Router();

// GET all photos
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const where = {};
    Object.keys(filters).forEach(key => {
      where[key] = filters[key];
    });

    const photos = await Photo.findAll({
      where,
      order: [['id', 'ASC']]
    });
    res.json(photos);
  } catch (error) {
    console.error('Fetch photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos.' });
  }
});

// POST create a new photo
router.post('/', async (req, res) => {
  try {
    const { albumId, title, url } = req.body;
    if (!albumId || !title || !url) {
      return res.status(400).json({ error: 'albumId, title, and url are required.' });
    }

    const userId = req.headers['x-user-id'];
    if (userId) {
      const album = await Album.findOne({ where: { id: albumId, userId } });
      if (!album) {
        return res.status(403).json({ error: 'Unauthorized. You do not own this album.' });
      }
    }

    const photo = await Photo.create({
      albumId,
      title,
      url
    });
    res.status(201).json({ success: true, id: photo.id });
  } catch (error) {
    console.error('Create photo error:', error);
    res.status(500).json({ error: 'Failed to create photo.' });
  }
});

// PATCH update photo
router.patch('/:id', async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.headers['x-user-id'];

    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    const album = await Album.findOne({ where: { id: photo.albumId, userId } });
    if (!album) {
      return res.status(403).json({ error: 'Unauthorized. You do not own the album this photo belongs to.' });
    }

    await photo.update(req.body);
    res.status(200).json({ success: true, id: photo.id });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Failed to update photo.' });
  }
});

// DELETE photo
router.delete('/:id', async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.headers['x-user-id'];

    const photo = await Photo.findByPk(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    const album = await Album.findOne({ where: { id: photo.albumId, userId } });
    if (!album) {
      return res.status(403).json({ error: 'Unauthorized. You do not own the album this photo belongs to.' });
    }

    await photo.destroy();
    res.json({ message: 'Photo deleted successfully.' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo.' });
  }
});

export default router;
