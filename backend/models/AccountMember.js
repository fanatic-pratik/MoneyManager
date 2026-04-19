const mongoose = require("mongoose");

const AccountMemberSchema = new mongoose.Schema({
  account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  role: {
    type: String,
    enum: ["owner", "member"],
    default: "member"
  },

  total_contributed: {
    type: Number,
    default: 0
  },

  total_withdrawn: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("AccountMember", AccountMemberSchema);