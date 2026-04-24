const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @GET /api/dashboard/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const { account_id } = req.query;

    const matchCondition = account_id
      ? { account_id }
      : { user: req.user._id };

    const [thisMonth, lastMonth, recentTransactions] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            ...matchCondition,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            ...matchCondition,
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      Transaction.find({ user: req.user._id }).sort({ date: -1 }).limit(5),
    ]);

    // const income = thisMonth.find((x) => x._id === 'income')?.total || 0;
    // const expense = thisMonth.find((x) => x._id === 'expense')?.total || 0;
    let income = 0;
    let expense = 0;
    let lastIncome = 0;
    let lastExpense = 0;

    if (account_id) {
      income = thisMonth.find(x => x._id === 'contribution')?.total || 0;
      expense = thisMonth.find(x => x._id === 'withdrawal')?.total || 0;
      lastIncome = lastMonth.find((x) => x._id === 'contribution')?.total || 0;
      lastExpense = lastMonth.find((x) => x._id === 'withdrawal')?.total || 0;
    } else {
      income = thisMonth.find(x => x._id === 'income')?.total || 0;
      expense = thisMonth.find(x => x._id === 'expense')?.total || 0;
      lastIncome = lastMonth.find((x) => x._id === 'income')?.total || 0;
      lastExpense = lastMonth.find((x) => x._id === 'expense')?.total || 0;
    }

    res.json({
      income,
      expense,
      balance: income - expense,
      savings: income > 0 ? ((income - expense) / income) * 100 : 0,
      incomeChange: lastIncome ? ((income - lastIncome) / lastIncome) * 100 : 0,
      expenseChange: lastExpense ? ((expense - lastExpense) / lastExpense) * 100 : 0,
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/dashboard/category-breakdown
router.get('/category-breakdown', protect, async (req, res) => {
  try {
    const {
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      type
    } = req.query;

    const { account_id } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const matchCondition = account_id
      ? { account_id }
      : { user: req.user._id };

    // 🔥 AUTO TYPE FIX
    let finalType = type;

    if (account_id) {
      finalType = type === 'income' ? 'contribution' : 'withdrawal';
    } else {
      finalType = type || 'expense';
    }

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          ...matchCondition,
          type: finalType,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalAmount = breakdown.reduce((sum, item) => sum + item.total, 0);

    res.json(
      breakdown.map((item) => ({
        category: item._id,
        total: item.total,
        count: item.count,
        percentage: totalAmount > 0
          ? ((item.total / totalAmount) * 100).toFixed(1)
          : 0,
      }))
    );

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/dashboard/monthly-trend
router.get('/monthly-trend', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const { account_id } = req.query;

    const matchCondition = account_id
      ? { account_id }
      : { user: req.user._id };

    const trend = await Transaction.aggregate([
      {
        $match: {
          ...matchCondition,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {

      let income = 0;
      let expense = 0;

      if (account_id) {
        income = trend.find(t => t._id.month === i + 1 && t._id.type === 'contribution')?.total || 0;
        expense = trend.find(t => t._id.month === i + 1 && t._id.type === 'withdrawal')?.total || 0;
      } else {
        income = trend.find(t => t._id.month === i + 1 && t._id.type === 'income')?.total || 0;
        expense = trend.find(t => t._id.month === i + 1 && t._id.type === 'expense')?.total || 0;
      }

      return {
        month: i + 1,
        income,
        expense,
        savings: income - expense
      };
    });

    res.json(months);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/dashboard/budget-overview
router.get('/budget-overview', protect, async (req, res) => {
  try {
    const { account_id } = req.query;

    // 🔥 SHARED → NO BUDGET
    if (account_id) {
      return res.json([]); // or return null
    }

    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    const budgets = await Budget.find({
      user: req.user._id,
      month: parseInt(month),
      year: parseInt(year),
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const overview = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              type: 'expense',
              category: budget.category,
              date: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const spentAmount = spent[0]?.total || 0;

        return {
          category: budget.category,
          limit: budget.limit,
          spent: spentAmount,
          remaining: budget.limit - spentAmount,
          percentage: Math.min(Math.round((spentAmount / budget.limit) * 100), 100),
          isOverBudget: spentAmount > budget.limit,
          alertThreshold: budget.alertThreshold,
        };
      })
    );

    res.json(overview);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
