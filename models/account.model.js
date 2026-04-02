const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
    avatar: String,
  },
  {
    timestamps: true,
  },
);

module.exports.Account = mongoose.model("Account", schema, "accounts");
