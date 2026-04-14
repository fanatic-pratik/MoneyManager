const express = require('express');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @GET /api/categories
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.$or = [{ type }, { type: 'both' }];
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/categories
router.post('/', protect, async (req, res) => {
  try {
    const category = await Category.create({ ...req.body, user: req.user._id });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/categories/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/categories/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      isDefault: false,
    });
    if (!category) return res.status(404).json({ message: 'Category not found or is a default category' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
