const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// 🔐 SAFE FIND HELPER
const safeFind = (arr, type) =>
  Array.isArray(arr) ? arr.find(x => x._id === type)?.total || 0 : 0;

// 🔐 SAFE MATCH CONDITION
const getMatch = (req) => {
  const { account_id } = req.query;

  if (account_id && mongoose.Types.ObjectId.isValid(account_id)) {
    return { account_id: new mongoose.Types.ObjectId(account_id) };
  }

  return { user: req.user._id };
};

// ==============================
// 📊 SUMMARY
// ==============================
router.get('/summary', protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const matchCondition = getMatch(req);

    const [thisMonth, lastMonth, recentTransactions] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...matchCondition, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...matchCondition, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]),
      Transaction.find(matchCondition).sort({ date: -1 }).limit(5),
    ]);

    const { account_id } = req.query;

    let income = 0;
    let expense = 0;
    let lastIncome = 0;
    let lastExpense = 0;

    if (account_id) {
      // 🔵 SHARED + LEGACY SUPPORT
      const contribution = safeFind(thisMonth, 'contribution');
      const repayment = safeFind(thisMonth, 'repayment');
      const incomeFallback = safeFind(thisMonth, 'income');

      const withdrawal = safeFind(thisMonth, 'withdrawal');
      const expenseFallback = safeFind(thisMonth, 'expense');

      income = contribution + repayment + incomeFallback;
      expense = withdrawal + expenseFallback;

      const lastContribution = safeFind(lastMonth, 'contribution');
      const lastRepayment = safeFind(lastMonth, 'repayment');
      const lastIncomeFallback = safeFind(lastMonth, 'income');

      const lastWithdrawal = safeFind(lastMonth, 'withdrawal');
      const lastExpenseFallback = safeFind(lastMonth, 'expense');

      lastIncome = lastContribution + lastRepayment + lastIncomeFallback;
      lastExpense = lastWithdrawal + lastExpenseFallback;

    } else {
      // 🟢 PERSONAL
      income = safeFind(thisMonth, 'income');
      expense = safeFind(thisMonth, 'expense');
      lastIncome = safeFind(lastMonth, 'income');
      lastExpense = safeFind(lastMonth, 'expense');
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
    console.error("SUMMARY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 📊 CATEGORY BREAKDOWN
// ==============================
router.get('/category-breakdown', protect, async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear(), type } = req.query;

    const matchCondition = getMatch(req);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const isShared = !!req.query.account_id;

    let finalType;

    if (isShared) {
      finalType = type === 'income'
        ? { $in: ['contribution', 'repayment', 'income'] }
        : { $in: ['withdrawal', 'expense'] };
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

    const total = breakdown.reduce((sum, i) => sum + i.total, 0);

    res.json(
      breakdown.map(i => ({
        category: i._id,
        total: i.total,
        count: i.count,
        percentage: total ? ((i.total / total) * 100).toFixed(1) : 0
      }))
    );

  } catch (err) {
    console.error("CATEGORY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 📈 MONTHLY TREND
// ==============================
router.get('/monthly-trend', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const matchCondition = getMatch(req);
    const isShared = !!req.query.account_id;

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
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      let income = 0;
      let expense = 0;

      if (isShared) {
        const contribution = trend.find(t => t._id.month === i + 1 && t._id.type === 'contribution')?.total || 0;
        const repayment = trend.find(t => t._id.month === i + 1 && t._id.type === 'repayment')?.total || 0;
        const incomeFallback = trend.find(t => t._id.month === i + 1 && t._id.type === 'income')?.total || 0;

        const withdrawal = trend.find(t => t._id.month === i + 1 && t._id.type === 'withdrawal')?.total || 0;
        const expenseFallback = trend.find(t => t._id.month === i + 1 && t._id.type === 'expense')?.total || 0;

        income = contribution + repayment + incomeFallback;
        expense = withdrawal + expenseFallback;
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
    console.error("TREND ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 💰 BUDGET OVERVIEW
// ==============================
router.get('/budget-overview', protect, async (req, res) => {
  try {
    if (req.query.account_id) {
      return res.json([]);
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
    console.error("BUDGET ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;