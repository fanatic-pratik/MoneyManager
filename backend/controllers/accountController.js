const Account = require("../models/Account");
const AccountMember = require("../models/AccountMember");

// helper
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

exports.createAccount = async (req, res) => {
  try {
    const { account_name, type, mode } = req.body;

    const invite_code = generateCode();

    const account = await Account.create({
      account_name,
      created_by: req.user.id,
      type,
      mode,
      invite_code
    });

    // add creator as owner
    await AccountMember.create({
      account_id: account._id,
      user_id: req.user.id,
      role: "owner"
    });

    res.json(account);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await AccountMember.find({ user_id: req.user.id })
      .populate("account_id");

    res.json(accounts);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.joinAccount = async (req, res) => {
  try {
    const { invite_code } = req.body;

    const account = await Account.findOne({ invite_code });

    if (!account) {
      return res.status(404).json({ msg: "Invalid code" });
    }

    // check already member
    const exists = await AccountMember.findOne({
      account_id: account._id,
      user_id: req.user.id
    });

    if (exists) {
      return res.status(400).json({ msg: "Already joined" });
    }

    await AccountMember.create({
      account_id: account._id,
      user_id: req.user.id
    });

    res.json({ msg: "Joined successfully" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};