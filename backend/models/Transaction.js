const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account"
    },

    type: {
      type: String,
      enum: [
        "income",
        "expense",
        "contribution",
        "withdrawal",
        "repayment"
      ],
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
    tags: [{ type: String, trim: true }],
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'other'],
      default: 'cash',
    },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Indexes for performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
