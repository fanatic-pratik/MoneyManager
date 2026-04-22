const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const AccountMember = require("../models/AccountMember");

exports.addTransaction = async (req, res) => {
  try {
    const { account_id, type, amount, note } = req.body;
    const user_id = req.user.id;

    // 1. Validate account
    const account = await Account.findById(account_id);
    if (!account) {
      return res.status(404).json({ msg: "Account not found" });
    }

    // 2. Check if user is member
    const member = await AccountMember.findOne({
      account_id,
      user_id
    });

    if (!member) {
      return res.status(403).json({ msg: "Not a member of this account" });
    }

    // 3. BUSINESS LOGIC 🔥

    if (type === "contribution") {
      member.total_contributed += amount;
    }

    else if (type === "withdrawal") {

      // STRICT MODE CHECK
      if (account.mode === "strict") {
        const balance = member.total_contributed - member.total_withdrawn;

        if (amount > balance) {
          return res.status(400).json({
            msg: "Insufficient balance (Strict mode)"
          });
        }
      }

      member.total_withdrawn += amount;
    }

    else if (type === "repayment") {
      // repayment acts like contribution
      member.total_contributed += amount;
    }

    else {
      return res.status(400).json({ msg: "Invalid transaction type" });
    }

    // 4. SAVE MEMBER UPDATE
    await member.save();

    // 5. CREATE TRANSACTION
    const transaction = await Transaction.create({
      account_id,
      user: user_id,
      type,
      amount,
      notes: note
    });

    // 6. RESPONSE
    res.json({
      msg: "Transaction successful",
      transaction
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};