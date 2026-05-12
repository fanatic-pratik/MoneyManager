const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    limit: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    alertThreshold: { type: Number, default: 80, min: 0, max: 100 }, // % to alert
  },
  { timestamps: true }
);


budgetSchema.index({ user: 1, account_id:1 ,category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
