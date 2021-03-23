const User = require("../models/userModel");
const Channel = require("../models/channelModel");
const catchAsync = require("../utilities/catchAsync");

const fileUpload = require("express-fileupload");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users
    }
  });
});

exports.updatePic = catchAsync(async (req, res) => {
  console.log("HERE IS ID :" + req.user.id);
  const filteredBody = filterObj(req.body, "name", "email");

  if (req.files) {
    let profile_pic = req.files.profile_pic;
    console.log("filter:" + filteredBody);

    console.log("PIC NAME" + req.files.profile_pic.name);

    filteredBody.profilePic = profile_pic.name;

    let file_name = `./uploads/${profile_pic.name}`;

    profile_pic.mv(file_name);

    res.render("image.ejs", { images: [file_name] });

    await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
  } else {
    res.end("<h1>No file was uploaded.</h1>");
  }
});

exports.updateName = catchAsync(async (req, res) => {
  const newName = req.body.newName;

  User.findByIdAndUpdate(
    req.user.id,
    { $set: { username: newName } },
    {
      new: true,
      runValidators: true
    }
  ).exec((err, data) => {
    if (err) console.log(err);
    console.log("Sucessfully edited user details.");
    res.redirect(`/user/profile/`);
  });
});

exports.showUserProfile = catchAsync(async (req, res) => {
  console.log("PROFILE CLICK" + req.user.id);

  User.find({}).exec((error, users) => {
    if (error) {
      return handleError(error);
    }
    res.render("profile.ejs", { users: users });
  });
});

exports.userHome = catchAsync(async (req, res) => {
  // console.log("USER REQUEST FROM APP.JS : " + req.user);
  Channel.find({}).exec((error, channels) => {
    if (error) {
      return handleError(error);
    }
    //console.log(books);
    res.render("home.ejs", {
      channels: channels,
      user: req.user
    });
  });
});
