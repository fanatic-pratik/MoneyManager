const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
    icon: { type: String, default: '📦' },
    color: { type: String, default: '#6366f1' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.index({ user: 1 });

module.exports = mongoose.model('Category', categorySchema);
