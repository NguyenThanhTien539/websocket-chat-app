const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: String,
    creatorId: String,
    members: Array,
    admins: Array,
    lastMessage: {
      senderId: String,
      content: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

schema.index({ members: 1, updatedAt: -1 });
schema.index({ creatorId: 1, updatedAt: -1 });

module.exports.Room = mongoose.model("Room", schema, "rooms");
