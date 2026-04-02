const express = require("express");
const router = express.Router();

const accountController = require("../controllers/account.controller");

router.get("/login", accountController.login);

router.post("/login", accountController.loginPost);

router.get("/register", accountController.register);

router.post("/register", accountController.registerPost);

router.get("/logout", accountController.logout);

module.exports = router;
