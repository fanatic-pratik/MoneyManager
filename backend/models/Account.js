const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  account_name: {
    type: String,
    required: true
  },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["personal", "shared"],
    default: "personal"
  },

  mode: {
    type: String,
    enum: ["strict", "loan"],
    default: "strict"
  },

  invite_code: {
    type: String,
    unique: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Account", AccountSchema);