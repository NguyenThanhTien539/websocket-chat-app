const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const accountRoutes = require("./account.route");
const chatRoutes = require("./chat.route");

router.get("/", authMiddleware.infoUser, (req, res) => {
  res.render("pages/home", {
    pageTitle: "BlinkChat - Home",
    pageStyles: ["home.css"],
  });
});

router.use("/account", accountRoutes);

router.use("/chat", chatRoutes);

module.exports = router;
