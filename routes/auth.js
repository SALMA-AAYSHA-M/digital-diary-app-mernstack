const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require(path.resolve(__dirname, '../models/User'));
const router = express.Router();
const bcrypt = require('bcrypt');

// Middleware to handle errors gracefully
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// User registration route
router.post('/register', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const existingUser = await User.findOne({ username: username.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username: username.toLowerCase(), password: hashedPassword });
  await user.save();
  res.status(201).json({ message: 'User registered successfully!' });
}));

// User login route
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    return res.status(404).json({ error: 'User not found!' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials!' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, message: 'Login successful!' });
}));

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = router;
