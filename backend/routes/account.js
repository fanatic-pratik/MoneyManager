const express = require("express");
const router = express.Router();
const { createAccount, getAccounts, joinAccount } = require("../controllers/accountController");
const auth = require("../middleware/auth");

router.post("/", auth, createAccount);
router.get("/", auth, getAccounts);
router.post("/join", auth, joinAccount);

module.exports = router;