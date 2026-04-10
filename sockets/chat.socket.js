const jwt = require("jsonwebtoken");
const { Account } = require("../models/account.model");
const { Chat } = require("../models/chat.model");
const { Room } = require("../models/room.model");
const presenceStore = require("../utils/presence.store");

function parseCookieHeader(cookieHeader = "") {
  return cookieHeader.split(";").reduce((result, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) return result;
    result[key] = decodeURIComponent(valueParts.join("="));
    return result;
  }, {});
}

module.exports = function registerChatSocket(io) {
  async function joinAllUserRooms(socket, userId) {
    const rooms = await Room.find({ members: userId }).select("_id");
    rooms.forEach((room) => {
      socket.join(`room:${String(room._id)}`);
    });
  }

  async function ensureRoomAccess(roomId, userId) {
    const room = await Room.findById(roomId);
    if (!room) return null;

    const memberIds = (room.members || []).map((id) => String(id));
    if (!memberIds.includes(String(userId))) {
      return null;
    }

    return room;
  }

  async function emitPresenceToFriends(userId, isOnline) {
    const account = await Account.findById(userId).select("friendList");
    const friendIds = (account?.friendList || []).map((id) => String(id));

    if (!friendIds.length) {
      return;
    }

    friendIds.forEach((friendId) => {
      io.to(`user:${friendId}`).emit("SERVER_FRIEND_PRESENCE_CHANGED", {
        userId: String(userId),
        isOnline,
      });
    });
  }

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie || "");
      const token = cookies.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const account = await Account.findOne({ email: decoded.email });

      if (!account) {
        return next(new Error("Unauthorized"));
      }

      socket.account = account;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const senderId = String(socket.account._id);
    socket.join(`user:${senderId}`);
    joinAllUserRooms(socket, senderId).catch((error) => {
      console.error("Error in joinAllUserRooms:", error);
    });

    const isUserJustOnline = presenceStore.addConnection(senderId, socket.id);
    const friendIds = (socket.account.friendList || []).map((id) => String(id));
    const onlineFriendIds = presenceStore.getOnlineIds(friendIds);

    socket.emit("SERVER_ONLINE_FRIENDS", {
      friendIds: onlineFriendIds,
    });

    if (isUserJustOnline) {
      emitPresenceToFriends(senderId, true).catch((error) => {
        console.error("Error in emitPresenceToFriends(online):", error);
      });
    }

    socket.on("CLIENT_SEND_MESSAGE", async (data = {}) => {
      try {
        const receiverId = String(data.receiverId || "").trim();
        const content = String(data.content || "").trim();

        if (!receiverId || !content) {
          return;
        }

        const chat = new Chat({
          senderId,
          receiverId,
          chatType: "direct",
          content,
        });
        await chat.save();

        io.to(`user:${senderId}`)
          .to(`user:${receiverId}`)
          .emit("SERVER_SEND_MESSAGE", {
            senderId,
            receiverId,
            fullName: socket.account.fullName,
            content,
            createdAt: chat.createdAt,
          });
      } catch (error) {
        console.error("Error in CLIENT_SEND_MESSAGE:", error);
      }
    });

    socket.on("CLIENT_TYPING", (data = {}) => {
      try {
        const receiverId = String(data.receiverId || "").trim();
        const isTyping = Boolean(data.isTyping);

        if (!receiverId) {
          return;
        }

        io.to(`user:${receiverId}`).emit("SERVER_TYPING", {
          senderId,
          receiverId,
          isTyping,
        });
      } catch (error) {
        console.error("Error in CLIENT_TYPING:", error);
      }
    });

    socket.on("CLIENT_JOIN_ROOM", async (data = {}) => {
      try {
        const roomId = String(data.roomId || "").trim();
        if (!roomId) return;

        const room = await ensureRoomAccess(roomId, senderId);
        if (!room) {
          socket.emit("SERVER_ROOM_ERROR", {
            roomId,
            message: "Bạn không có quyền truy cập phòng chat này",
          });
          return;
        }

        socket.join(`room:${roomId}`);
      } catch (error) {
        console.error("Error in CLIENT_JOIN_ROOM:", error);
      }
    });

    socket.on("CLIENT_LEAVE_ROOM", (data = {}) => {
      try {
        const roomId = String(data.roomId || "").trim();
        if (!roomId) return;

        socket.leave(`room:${roomId}`);
      } catch (error) {
        console.error("Error in CLIENT_LEAVE_ROOM:", error);
      }
    });

    socket.on("CLIENT_SEND_ROOM_MESSAGE", async (data = {}) => {
      try {
        const roomId = String(data.roomId || "").trim();
        const content = String(data.content || "").trim();

        if (!roomId || !content) {
          return;
        }

        const room = await ensureRoomAccess(roomId, senderId);
        if (!room) {
          socket.emit("SERVER_ROOM_ERROR", {
            roomId,
            message: "Bạn không có quyền gửi tin nhắn vào phòng này",
          });
          return;
        }

        const chat = new Chat({
          senderId,
          roomId,
          chatType: "room",
          content,
        });
        await chat.save();

        await Room.updateOne(
          { _id: roomId },
          {
            $set: {
              lastMessage: {
                senderId,
                content,
                createdAt: chat.createdAt,
              },
              updatedAt: new Date(),
            },
          },
        );

        const payload = {
          senderId,
          roomId,
          chatType: "room",
          fullName: socket.account.fullName,
          content,
          createdAt: chat.createdAt,
        };

        io.to(`room:${roomId}`).emit("SERVER_SEND_ROOM_MESSAGE", payload);

        (room.members || []).forEach((memberId) => {
          io.to(`user:${String(memberId)}`).emit("SERVER_ROOM_UPDATED", {
            roomId,
            type: "message",
            lastMessage: payload,
          });
        });
      } catch (error) {
        console.error("Error in CLIENT_SEND_ROOM_MESSAGE:", error);
      }
    });

    socket.on("CLIENT_SEND_FRIEND_REQUEST", async (data = {}) => {
      try {
        const toUserId = String(data.toUserId || "").trim();
        if (!toUserId) return;

        const existAInB = await Account.findOne({
          _id: toUserId,
          acceptedFriends: senderId,
        });

        if (!existAInB) {
          await Account.updateOne(
            { _id: toUserId },
            { $push: { acceptedFriends: senderId } },
          );
        }

        const existBInA = await Account.findOne({
          _id: senderId,
          requestedFriends: toUserId,
        });

        if (!existBInA) {
          await Account.updateOne(
            { _id: senderId },
            { $push: { requestedFriends: toUserId } },
          );
        }
      } catch (error) {
        console.error("Error in CLIENT_SEND_FRIEND_REQUEST:", error);
      }
    });

    socket.on("CLIENT_CANCEL_FRIEND_REQUEST", async (data = {}) => {
      try {
        const toUserId = String(data.toUserId || "").trim();
        if (!toUserId) return;

        const existAInB = await Account.findOne({
          _id: toUserId,
          acceptedFriends: senderId,
        });

        if (existAInB) {
          await Account.updateOne(
            { _id: toUserId },
            { $pull: { acceptedFriends: senderId } },
          );
        }

        const existBInA = await Account.findOne({
          _id: senderId,
          requestedFriends: toUserId,
        });

        if (existBInA) {
          await Account.updateOne(
            { _id: senderId },
            { $pull: { requestedFriends: toUserId } },
          );
        }
      } catch (error) {
        console.error("Error in CLIENT_CANCEL_FRIEND_REQUEST:", error);
      }
    });

    socket.on("CLIENT_DECLINE_FRIEND_REQUEST", async (data = {}) => {
      try {
        const toUserId = String(data.toUserId || "").trim();
        if (!toUserId) return;

        const existAInB = await Account.findOne({
          _id: toUserId,
          requestedFriends: senderId,
        });

        if (existAInB) {
          await Account.updateOne(
            { _id: toUserId },
            { $pull: { requestedFriends: senderId } },
          );
        }

        const existBInA = await Account.findOne({
          _id: senderId,
          acceptedFriends: toUserId,
        });

        if (existBInA) {
          await Account.updateOne(
            { _id: senderId },
            { $pull: { acceptedFriends: toUserId } },
          );
        }
      } catch (error) {
        console.error("Error in CLIENT_DECLINE_FRIEND_REQUEST:", error);
      }
    });

    socket.on("CLIENT_ACCEPT_FRIEND_REQUEST", async (data = {}) => {
      try {
        const toUserId = String(data.toUserId || "").trim();
        if (!toUserId) return;

        const existAInB = await Account.findOne({
          _id: toUserId,
          requestedFriends: senderId,
        });

        if (existAInB) {
          await Account.updateOne(
            { _id: toUserId },
            { $pull: { requestedFriends: senderId } },
          );
        }

        const existBInA = await Account.findOne({
          _id: senderId,
          acceptedFriends: toUserId,
        });

        if (existBInA) {
          await Account.updateOne(
            { _id: senderId },
            { $pull: { acceptedFriends: toUserId } },
          );
        }

        const exitAInFriendListOfB = await Account.findOne({
          _id: toUserId,
          friendList: senderId,
        });

        if (!exitAInFriendListOfB) {
          await Account.updateOne(
            { _id: toUserId },
            { $push: { friendList: senderId } },
          );
        }

        const existBInFriendListOfA = await Account.findOne({
          _id: senderId,
          friendList: toUserId,
        });

        if (!existBInFriendListOfA) {
          await Account.updateOne(
            { _id: senderId },
            { $push: { friendList: toUserId } },
          );
        }
      } catch (error) {
        console.error("Error in CLIENT_ACCEPT_FRIEND_REQUEST:", error);
      }
    });

    socket.on("disconnect", () => {
      const isUserNowOffline = presenceStore.removeConnection(
        senderId,
        socket.id,
      );

      if (!isUserNowOffline) {
        return;
      }

      emitPresenceToFriends(senderId, false).catch((error) => {
        console.error("Error in emitPresenceToFriends(offline):", error);
      });
    });
  });
};
