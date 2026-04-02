const express = require("express");
const router = express.Router();

const uiController = require("../controllers/ui.controller");
const authMiddleware = require("../middleware/auth.middleware");
const accountRoutes = require("./account.route");

router.use("/account", accountRoutes);

router.get("/", authMiddleware.infoUser, uiController.homePage);

router.get("/users", uiController.usersPage);
router.get("/friends", uiController.friendsPage);
router.get("/requests-sent", uiController.requestsSentPage);
router.get("/requests-received", uiController.requestsReceivedPage);
router.get("/rooms", uiController.roomsPage);
router.get("/chat", uiController.chatPage);

module.exports = router;
