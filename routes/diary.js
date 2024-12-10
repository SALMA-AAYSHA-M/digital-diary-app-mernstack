const express = require('express');
const { body, validationResult } = require('express-validator');
const DiaryEntry = require('../models/DiaryEntry');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract "Bearer token"

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });

    req.userId = user.userId; // Attach decoded userId to request
    next();
  });
};

// Create a diary entry
router.post(
  '/',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;

    try {
      const entry = new DiaryEntry({ userId: req.userId, title, content });
      await entry.save();
      res.status(201).json(entry);
    } catch (error) {
      console.error('Error saving entry:', error);
      res.status(500).json({ message: 'Error saving the entry. Please try again.' });
    }
  }
);

// Update a diary entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required!' });
  }

  try {
    const updatedEntry = await DiaryEntry.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { title, content },
      { new: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ message: 'Entry not found or not authorized!' });
    }

    res.json(updatedEntry);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ message: 'Failed to update the entry. Please try again.' });
  }
});

// Get all diary entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ userId: req.userId });
    res.json(entries);
  } catch (err) {
    console.error('Error fetching entries:', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Delete a diary entry
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedEntry = await DiaryEntry.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deletedEntry) {
      return res.status(404).json({ message: 'Entry not found or not authorized to delete!' });
    }

    res.json({ message: 'Entry deleted successfully!' });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ message: 'Failed to delete the entry. Please try again.' });
  }
});

// Get a specific diary entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await DiaryEntry.findOne({ _id: id, userId: req.userId });
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found or not authorized!' });
    }
    res.json(entry);
  } catch (err) {
    console.error('Error fetching entry:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.query;  // Get the search query from the request parameters
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const entries = await Entry.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },  // Case-insensitive search
        { content: { $regex: query, $options: 'i' } }
      ]
    });

    res.json(entries);  // Return the search results
  } catch (error) {
    res.status(500).json({ error: 'Error searching entries.' });
  }
});

module.exports = router;
