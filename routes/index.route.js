const express = require("express");
const router = express.Router();

const uiController = require("../controllers/ui.controller");

router.get("/", uiController.homePage);
router.get("/login", uiController.loginPage);
router.get("/register", uiController.registerPage);
router.get("/users", uiController.usersPage);
router.get("/friends", uiController.friendsPage);
router.get("/requests-sent", uiController.requestsSentPage);
router.get("/requests-received", uiController.requestsReceivedPage);
router.get("/rooms", uiController.roomsPage);
router.get("/chat", uiController.chatPage);

module.exports = router;
