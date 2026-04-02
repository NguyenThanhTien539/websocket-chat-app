const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware.requireAuth, chatController.dashboardPage);

router.get("/discover", chatController.discoverPage);

router.get("/friends", chatController.friendsPage);

router.get("/requests/sent", chatController.requestsSentPage);

router.get("/requests/received", chatController.requestsReceivedPage);

router.get("/rooms", chatController.roomsPage);

router.get("/rooms/:roomId", chatController.roomDetailPage);

router.get("/ai", chatController.aiPage);

module.exports = router;
