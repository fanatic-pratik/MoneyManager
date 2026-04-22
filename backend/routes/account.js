const express = require("express");
const router = express.Router();
const { createAccount, getAccounts, joinAccount } = require("../controllers/accountController");
const { protect } = require("../middleware/auth");
console.log("createAccount:", typeof createAccount);
console.log("auth:", typeof protect);

router.post("/", protect, createAccount);
router.get("/", protect, getAccounts);
router.post("/join", protect, joinAccount);

module.exports = router;