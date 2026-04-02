const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    userId: String,
    content: String,
    images: Array,
    // videos: Array,
    // files: Array,
  },
  {
    timestamps: true,
  },
);

module.exports.Chat = mongoose.model("Chat", schema, "chats");
