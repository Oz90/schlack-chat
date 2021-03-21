const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  private: {
    type: Boolean,
    default: false
  },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel;
