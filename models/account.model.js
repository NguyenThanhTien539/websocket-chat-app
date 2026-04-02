const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
    avatar: String,
    acceptedFriends: Array,
    requestedFriends: Array,
    friendList: Array,
  },
  {
    timestamps: true,
  },
);

module.exports.Account = mongoose.model("Account", schema, "accounts");
