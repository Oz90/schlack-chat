const User = require("../models/userModel");
const Channel = require("../models/channelModel");
const catchAsync = require("../utilities/catchAsync");

exports.createChannel = catchAsync(async (req, res) => {
  const channelName = req.body.channelName;

  Channel.create({
    name: channelName
  });

  res.redirect("/user/home");
});

exports.joinChannel = catchAsync(async (req, res) => {
  console.log(req.user);
  const channelId = req.params.id;

  Channel.find({ _id: channelId })
    .populate(["Message", "User"])
    .exec((error, channels) => {
      if (error) {
        return handleError(error);
      }
      res.render("chatroom.ejs", {
        channels: channels,
        user: req.user
      });
    });
});

exports.deleteChannel = catchAsync(async (req, res) => {
  //   const channelId = req.params.id;

  const channel = await Channel.findByIdAndDelete(req.params.id);

  res.redirect("/user/home");
});
