const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware.requireAuth, chatController.dashboardPage);

router.get(
  "/discover",
  authMiddleware.requireAuth,
  chatController.discoverPage,
);

router.get("/friends", authMiddleware.requireAuth, chatController.friendsPage);

router.get(
  "/requests/sent",
  authMiddleware.requireAuth,
  chatController.requestsSentPage,
);

router.get(
  "/requests/received",
  authMiddleware.requireAuth,
  chatController.requestsReceivedPage,
);

router.get("/rooms", authMiddleware.requireAuth, chatController.roomsPage);

router.get(
  "/rooms/:roomId",
  authMiddleware.requireAuth,
  chatController.roomDetailPage,
);

router.get("/ai", authMiddleware.requireAuth, chatController.aiPage);

module.exports = router;
