const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utilities/catchAsync");
const AppError = require("../utilities/appError");
const { promisify } = require("util");
const mongoose = require("mongoose");
const Channel = require("../models/channelModel");

// BREAKS MY CODE TO TRY TO CREATE FUNCTIONS OUF OF THESE. NOT SURE WHY..... INVESTIGATE!?
// const signToken = (id, username) => {
//   return jwt.sign({ id: id, username: username }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN
//   });
// };

// const createSendToken = (user, req, res) => {
//   const token = signToken(user._id);
//   console.log("TOKEN SIGN: " + user._id);
//   console.log("TOKEEEN     " + token);

//   res.cookie("token", token, {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     secure: req.secure || req.headers["x-forwarded-proto"] === "https"
//   });
//   res.redirect("/home");
//   // Remove password from output
//   user.password = undefined;
// };

exports.register = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password"); //måste lägga till select.+password eftersom password är "select: false" i user model.
  // console.log("USERSSS " + user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }

  // 3) If everything is OK, send the token to client
  const token = jwt.sign(
    { id: user._id, username: user.username, profilePic: user.profilePic },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );

  res.cookie("token", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https"
  });
  res.redirect("/home");
  // Remove password from output
  user.password = undefined;
});

exports.protect = catchAsync(async (req, res, next) => {
  const token = req.cookies.token;
  if (token === undefined) {
    return res.render("login.ejs", { error: "Please log in " });
  }

  //Verify token. Kolla om användaren har access till kanalen?
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.verifyAccess = catchAsync(async (req, res, next) => {
  // console.log("MA USER: " + req.user);
  const token = req.cookies.token;
  if (token === undefined) {
    return res.render("login.ejs", { error: "Please log in " });
  }
  //Verify token.
  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    // console.log(user);
    if (err) return res.send(err);

    try {
      const channelID = req.params.id;
      if (!mongoose.isValidObjectId(channelID)) {
        return res.redirect("/home");
      }
      const currentChannel = await Channel.findOne({ _id: channelID });
      // console.log(currentChannel, "USERID: " + user.id);
      //Kollar om kanalen är privat och om användaren har tillgång till kanalen. Om inte, redirect.
      if (currentChannel.private && !currentChannel.users.includes(user.id)) {
        console.log("running");
        res.redirect("/home");
      } else {
        //Kanalen är privat och användaren har tillgång eller kanalen är public. Oavsett har användaren tillgång
        req.user = user;
        next();
      }
    } catch (error) {
      res.send(error.message);
    }
  });
});
