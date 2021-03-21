const express = require("express");
// const userController = require('./../controllers/userController');
const authController = require("../controllers/authController");
const User = require("../models/userModel");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/profile", authController.protect, (req, res) => {
  console.log("PROFILE CLICK" + req.user.id);

  User.find({}).exec((error, users) => {
    if (error) {
      return handleError(error);
    }
    res.render("profile.ejs", { users: users });
  });
});

module.exports = router;
