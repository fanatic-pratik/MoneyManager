const express = require('express');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @GET /api/budgets?month=&year=
router.get('/', protect, async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    const { account_id } = req.query;

    const budgets = await Budget.find({
      user: req.user._id,
      account_id,
      month: parseInt(month),
      year: parseInt(year),
    });

    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(budget.year, budget.month - 1, 1);
        const endDate = new Date(budget.year, budget.month, 0);

        const spent = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              account_id: budget.account_id,
              type: 'expense',
              category: budget.category,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        return {
          ...budget.toObject(),
          spent: spent[0]?.total || 0,
          percentage: Math.round(((spent[0]?.total || 0) / budget.limit) * 100),
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/budgets
router.post('/', protect, async (req, res) => {
  try {
    const { category, limit, month, year, alertThreshold, account_id } = req.body;

    // Upsert: update if exists
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, account_id, category, month, year },
      { limit, alertThreshold, account_id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/budgets/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/budgets/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
