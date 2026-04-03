const { Account } = require("../models/account.model");
const { Chat } = require("../models/chat.model");

const currentUser = {
  id: "u0",
  name: "Tien Nguyen",
  avatar: "TN",
  status: "online",
};

const users = [
  {
    id: "u1",
    name: "Linh Tran",
    avatar: "LT",
    status: "online",
    bio: "Frontend Developer",
    isFriend: false,
  },
  {
    id: "u2",
    name: "Hoang Pham",
    avatar: "HP",
    status: "offline",
    bio: "Product Designer",
    isFriend: true,
  },
  {
    id: "u3",
    name: "An Vo",
    avatar: "AV",
    status: "online",
    bio: "QA Engineer",
    isFriend: false,
  },
  {
    id: "u4",
    name: "Minh Le",
    avatar: "ML",
    status: "offline",
    bio: "Backend Developer",
    isFriend: true,
  },
];

const friends = [
  {
    id: "u2",
    name: "Hoang Pham",
    avatar: "HP",
    status: "online",
    lastMessage: "Tối nay họp team lúc 8h nhé.",
  },
  {
    id: "u4",
    name: "Minh Le",
    avatar: "ML",
    status: "offline",
    lastMessage: "Mình đã gửi lại tài liệu UI.",
  },
  {
    id: "u5",
    name: "Nhi Dang",
    avatar: "ND",
    status: "online",
    lastMessage: "Đang nhập...",
  },
];

const sentRequests = [
  { id: "u6", name: "Bao Nguyen", avatar: "BN", statusLabel: "Đang chờ" },
  { id: "u7", name: "Khanh Truong", avatar: "KT", statusLabel: "Đang chờ" },
];

const receivedRequests = [
  {
    id: "u8",
    name: "Huyen Pham",
    avatar: "HP",
    statusLabel: "Vừa gửi lời mời",
  },
  { id: "u9", name: "Duc Nguyen", avatar: "DN", statusLabel: "2 phút trước" },
];

const rooms = [
  {
    id: "r1",
    name: "Team Product",
    avatar: "TP",
    members: 8,
    lastMessage: "Linh: Mọi người review flow mới giúp mình.",
    unread: 3,
  },
  {
    id: "r2",
    name: "UI/UX Club",
    avatar: "UX",
    members: 15,
    lastMessage: "An: Đã cập nhật mockup trang home.",
    unread: 0,
  },
  {
    id: "r3",
    name: "Project Orion",
    avatar: "PO",
    members: 6,
    lastMessage: "Minh: Chốt sprint planning lúc 10h.",
    unread: 1,
  },
];

const directMessages = [
  {
    id: "m1",
    senderName: "Hoang Pham",
    senderAvatar: "HP",
    side: "left",
    text: "Chào bạn, hôm nay mình cần bàn về phần giao diện chat nhé.",
    time: "09:12",
  },
  {
    id: "m2",
    senderName: "Bạn",
    senderAvatar: "TN",
    side: "right",
    text: "Ok luôn, mình vừa update style cho responsive mobile.",
    time: "09:14",
    state: "Seen",
  },
  {
    id: "m3",
    senderName: "Hoang Pham",
    senderAvatar: "HP",
    side: "left",
    text: "Nice! Để mình test thêm phần badge unread.",
    time: "09:16",
  },
];

const groupMessages = [
  {
    id: "gm1",
    senderName: "Linh Tran",
    senderAvatar: "LT",
    side: "left",
    text: "Mình vừa push mock data cho rooms rồi nhé.",
    time: "10:01",
  },
  {
    id: "gm2",
    senderName: "Bạn",
    senderAvatar: "TN",
    side: "right",
    text: "Tuyệt, mình sẽ style lại chat bubble để đọc dễ hơn.",
    time: "10:03",
    state: "Sent",
  },
  {
    id: "gm3",
    senderName: "An Vo",
    senderAvatar: "AV",
    side: "left",
    text: "Nhớ thêm trạng thái typing để có cảm giác realtime nhé.",
    time: "10:04",
  },
];

function commonData(activeMenu) {
  return {
    pageTitle: "BlinkChat UI",
    currentUser,
    users,
    friends,
    sentRequests,
    receivedRequests,
    rooms,
    directMessages,
    groupMessages,
    activeMenu,
    showSidebar: true,
    pageStyles: ["chat.css"],
  };
}
function dashboardViewData() {
  return {
    ...commonData("dashboard"),
    pageTitle: "Dashboard - BlinkChat",
    selectedDirectFriend: friends[0] || null,
  };
}

module.exports.dashboardPage = (req, res) => {
  res.render("pages/dashboard", dashboardViewData());
};

module.exports.discoverPage = async (req, res) => {
  const strangers = await Account.find({
    $and: [
      { _id: { $ne: req.account.id } },
      { acceptedFriends: { $nin: req.account.id } },
      { requestedFriends: { $nin: req.account.id } },
      { friendList: { $nin: req.account.id } },
    ],
  });

  const friendRequests = await Account.find({
    _id: { $in: req.account.acceptedFriends },
  });
  _io.once("connection", (socket) => {
    socket.on("CLIENT_SEND_FRIEND_REQUEST", async (data) => {
      //Add userA to userB's friend list
      const existAInB = await Account.findOne({
        _id: data.toUserId,
        acceptedFriends: req.account.id,
      });

      if (!existAInB) {
        await Account.updateOne(
          { _id: data.toUserId },
          { $push: { acceptedFriends: req.account.id } },
        );
      }

      // Add userB to userA's requestedFriends list
      const existBInA = await Account.findOne({
        _id: req.account.id,
        requestedFriends: data.toUserId,
      });
      if (!existBInA) {
        await Account.updateOne(
          { _id: req.account.id },
          { $push: { requestedFriends: data.toUserId } },
        );
      }
    });
  });
  res.render("pages/users", {
    ...commonData("discover"),
    strangers: strangers,
    friendRequests: friendRequests,
  });
};

module.exports.friendsPage = async (req, res) => {
  const friends = await Account.find({ _id: { $in: req.account.friendList } });

  const activeFriendId = req.query.friendId || friends[0]?._id?.toString();

  const chats = activeFriendId
    ? await Chat.find({
        $or: [
          { senderId: req.account.id, receiverId: activeFriendId },
          { senderId: activeFriendId, receiverId: req.account.id },
        ],
      }).sort({ createdAt: 1 })
    : [];

  _io.once("connection", (socket) => {
    socket.on("CLIENT_SEND_MESSAGE", async (data) => {
      const dataChat = {
        senderId: req.account.id,
        receiverId: data.receiverId,
        content: data.content,
      };

      const chat = new Chat(dataChat);
      await chat.save();

      _io.emit("SERVER_SEND_MESSAGE", {
        senderId: req.account.id,
        fullName: req.account.fullName,
        content: data.content,
      });
    });
  });

  res.render("pages/friends", {
    ...commonData("friends"),
    allFriends: friends,
    chats: chats,
    currentUserId: req.account.id,
    activeFriendId: activeFriendId,
  });
};

module.exports.requestsSentPage = async (req, res) => {
  const sendRequests = await Account.find({
    _id: { $in: req.account.requestedFriends },
  });
  _io.once("connection", (socket) => {
    socket.on("CLIENT_CANCEL_FRIEND_REQUEST", async (data) => {
      // Remove userA from userB's friend list
      const existAInB = await Account.findOne({
        _id: data.toUserId,
        acceptedFriends: req.account.id,
      });

      if (existAInB) {
        await Account.updateOne(
          { _id: data.toUserId },
          { $pull: { acceptedFriends: req.account.id } },
        );
      }

      // Remove userB from userA's requestedFriends list
      const existBInA = await Account.findOne({
        _id: req.account.id,
        requestedFriends: data.toUserId,
      });
      if (existBInA) {
        await Account.updateOne(
          { _id: req.account.id },
          { $pull: { requestedFriends: data.toUserId } },
        );
      }
    });
  });
  res.render("pages/requests-sent", {
    ...commonData("requests-sent"),
    users: sendRequests,
  });
};

module.exports.requestsReceivedPage = async (req, res) => {
  const receivedRequests = await Account.find({
    _id: { $in: req.account.acceptedFriends },
  });
  _io.once("connection", (socket) => {
    socket.on("CLIENT_DECLINE_FRIEND_REQUEST", async (data) => {
      // Remove userA from userB's friend list
      const existAInB = await Account.findOne({
        _id: data.toUserId,
        requestedFriends: req.account.id,
      });

      if (existAInB) {
        await Account.updateOne(
          { _id: data.toUserId },
          { $pull: { requestedFriends: req.account.id } },
        );
      }

      // Remove userB from userA's requestedFriends list
      const existBInA = await Account.findOne({
        _id: req.account.id,
        acceptedFriends: data.toUserId,
      });
      if (existBInA) {
        await Account.updateOne(
          { _id: req.account.id },
          { $pull: { acceptedFriends: data.toUserId } },
        );
      }
    });

    socket.on("CLIENT_ACCEPT_FRIEND_REQUEST", async (data) => {
      // Remove userA from userB's requestedFriends list
      const existAInB = await Account.findOne({
        _id: data.toUserId,
        requestedFriends: req.account.id,
      });

      if (existAInB) {
        await Account.updateOne(
          { _id: data.toUserId },
          { $pull: { requestedFriends: req.account.id } },
        );
      }
      // Remove userA from userB's friend list
      const existBInA = await Account.findOne({
        _id: req.account.id,
        acceptedFriends: data.toUserId,
      });
      if (existBInA) {
        await Account.updateOne(
          { _id: req.account.id },
          { $pull: { acceptedFriends: data.toUserId } },
        );
      }

      //add userA to userB's friend list
      const exitAInFriendListOfB = await Account.findOne({
        _id: data.toUserId,
        friendList: req.account.id,
      });
      if (!exitAInFriendListOfB) {
        await Account.updateOne(
          { _id: data.toUserId },
          { $push: { friendList: req.account.id } },
        );
      }

      // Add userB to userA's friend list
      const existBInFriendListOfA = await Account.findOne({
        _id: req.account.id,
        friendList: data.toUserId,
      });
      if (!existBInFriendListOfA) {
        await Account.updateOne(
          { _id: req.account.id },
          { $push: { friendList: data.toUserId } },
        );
      }
    });
  });

  res.render("pages/requests-received", {
    ...commonData("requests-received"),
    users: receivedRequests,
  });
};

module.exports.roomsPage = (req, res) => {
  res.render("pages/rooms", {
    ...commonData("rooms"),
    selectedRoom: rooms[0],
  });
};

module.exports.roomDetailPage = (req, res) => {
  const selectedRoom =
    rooms.find((room) => room.id === req.params.roomId) || rooms[0];

  res.render("pages/rooms", {
    ...commonData("rooms"),
    selectedRoom,
  });
};

module.exports.aiPage = (req, res) => {
  res.render("pages/chat", {
    ...commonData("ai"),
    pageTitle: "Chat - BlinkChat",
    selectedDirectFriend: friends[0],
    selectedRoom: rooms[0],
  });
};
