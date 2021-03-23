const express = require("express");
// const userController = require('./../controllers/userController');
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const User = require("../models/userModel");
const Channel = require("../models/channelModel");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login.ejs");
});

router.get("/register", (req, res) => {
  res.render("register.ejs");
});
router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/home", authController.protect, userController.userHome);

router.get("/profile", authController.protect, userController.showUserProfile);

router.post(
  "/upload-profile-pic",
  authController.protect,
  userController.updatePic
);

router.post("/update-name", authController.protect, userController.updateName);

module.exports = router;
