const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

// Default categories for new users
const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#f97316' },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8b5cf6' },
  { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#ef4444' },
  { name: 'Bills & Utilities', type: 'expense', icon: '⚡', color: '#f59e0b' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#06b6d4' },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#10b981' },
  { name: 'Other Expense', type: 'expense', icon: '📦', color: '#6b7280' },
  { name: 'Salary', type: 'income', icon: '💼', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#14b8a6' },
  { name: 'Investment', type: 'income', icon: '📈', color: '#84cc16' },
  { name: 'Gift', type: 'income', icon: '🎁', color: '#f43f5e' },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#a855f7' },
];

// @POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });

      const user = await User.create({ name, email, password });

      // Create default categories
      const cats = DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id, isDefault: true }));
      await Category.insertMany(cats);

      res.status(201).json({ user, token: generateToken(user._id) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// @POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      res.json({ user, token: generateToken(user._id) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// @GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// @PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currency } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, currency },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
