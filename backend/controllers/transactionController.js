const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const AccountMember = require("../models/AccountMember");

exports.addTransaction = async (req, res) => {
  try {
    const {
      account_id,
      type,
      amount,
      category,
      description,
      notes
    } = req.body;

    const user_id = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    // =========================
    // 🔵 SHARED ACCOUNT FLOW
    // =========================
    if (account_id) {

      const account = await Account.findById(account_id);
      if (!account) {
        return res.status(404).json({ msg: "Account not found" });
      }

      const member = await AccountMember.findOne({
        account_id,
        user_id
      });

      if (!member) {
        return res.status(403).json({ msg: "Not a member" });
      }

      let balance = member.total_contributed - member.total_withdrawn;

      if (type === "contribution") {
        member.total_contributed += amount;
      }

      else if (type === "withdrawal") {

        if (account.mode === "strict" && amount > balance) {
          return res.status(400).json({
            msg: "Insufficient balance"
          });
        }

        member.total_withdrawn += amount;
      }

      else if (type === "repayment") {
        member.total_contributed += amount;
      }

      else {
        return res.status(400).json({ msg: "Invalid shared type" });
      }

      await member.save();

      const transaction = await Transaction.create({
        account_id,
        user: user_id,
        type,
        amount,
        notes
      });

      return res.json({
        msg: "Shared transaction added",
        transaction
      });
    }

    // =========================
    // 🟢 PERSONAL FLOW (OLD LOGIC)
    // =========================

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ msg: "Invalid personal type" });
    }

    const transaction = await Transaction.create({
      user: user_id,
      type,
      amount,
      category,
      description,
      notes
    });

    return res.json({
      msg: "Personal transaction added",
      transaction
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};