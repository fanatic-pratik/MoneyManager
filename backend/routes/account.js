const express = require("express");
const router = express.Router();
const { createAccount, getAccounts, joinAccount, getAccountSummary } = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

router.post("/", protect, createAccount);
router.get("/", protect, getAccounts);
router.post("/join", protect, joinAccount);
router.get("/:account_id/summary", protect, getAccountSummary);

module.exports = router;