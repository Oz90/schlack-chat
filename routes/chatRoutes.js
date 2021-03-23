const express = require("express");
const authController = require("../controllers/authController");
const chatController = require("../controllers/chatController");

const router = express.Router();

router.post(
  "/createChannel",
  authController.protect,
  chatController.createChannel
);

router.get("/:id", authController.protect, chatController.joinChannel);

router.get("/delete/:id", authController.protect, chatController.deleteChannel);

module.exports = router;
