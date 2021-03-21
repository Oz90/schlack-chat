const User = require("../models/userModel");
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

exports.updateMe = catchAsync(async (req, res) => {
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
    res.redirect(`/profile/`);
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined."
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined."
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined."
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined."
  });
};
