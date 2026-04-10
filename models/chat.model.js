const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    senderId: String,
    receiverId: String,
    chatType: {
      type: String,
      enum: ["direct", "room"],
      default: "direct",
    },
    roomId: String,
    content: String,
    images: Array,
    // videos: Array,
    // files: Array,
  },
  {
    timestamps: true,
  },
);

schema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
schema.index({ roomId: 1, createdAt: 1 });
schema.index({ chatType: 1, createdAt: -1 });

module.exports.Chat = mongoose.model("Chat", schema, "chats");
