const { Account } = require("../models/account.model");
const { Chat } = require("../models/chat.model");
const { Room } = require("../models/room.model");
const mongoose = require("mongoose");
const presenceStore = require("../utils/presence.store");

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

function normalizeId(value) {
  return String(value || "").trim();
}

function getInitials(fullName = "") {
  return String(fullName || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(normalizeId(value));
}

async function getFriendOptions(account) {
  const friendIds = (account.friendList || []).map((id) => normalizeId(id));
  const friends = await Account.find({ _id: { $in: friendIds } }).select(
    "_id fullName avatar",
  );

  return friends.map((friend) => {
    const friendId = normalizeId(friend._id);

    return {
      id: friendId,
      fullName: friend.fullName,
      avatar: friend.avatar || getInitials(friend.fullName),
    };
  });
}

async function renderRoomsPage(req, res, selectedRoomId = null) {
  const currentUserId = normalizeId(req.account.id);
  const rooms = await Room.find({ members: currentUserId }).sort({
    updatedAt: -1,
  });

  const allMemberIds = [
    ...new Set(
      rooms.flatMap((room) => (room.members || []).map((id) => normalizeId(id))),
    ),
  ];

  const members = allMemberIds.length
    ? await Account.find({ _id: { $in: allMemberIds } }).select("_id fullName avatar")
    : [];
  const membersById = new Map(
    members.map((member) => [normalizeId(member._id), member]),
  );

  const roomCards = rooms.map((room) => {
    const roomId = normalizeId(room._id);
    const latestContent = room.lastMessage?.content || "Chưa có tin nhắn";

    return {
      id: roomId,
      name: room.name,
      members: (room.members || []).length,
      avatar: getInitials(room.name),
      lastMessage: latestContent,
      unread: 0,
      canInvite: (room.admins || [])
        .map((id) => normalizeId(id))
        .includes(currentUserId),
    };
  });

  const activeRoomId =
    normalizeId(selectedRoomId) || normalizeId(roomCards[0]?.id || "");

  const selectedRoom =
    roomCards.find((room) => normalizeId(room.id) === activeRoomId) || null;

  const chats = activeRoomId
    ? await Chat.find({
        roomId: activeRoomId,
        $or: [{ chatType: "room" }, { chatType: { $exists: false } }],
      }).sort({ createdAt: 1 })
    : [];

  const roomMessages = chats.map((chat) => {
    const senderId = normalizeId(chat.senderId);
    const sender = membersById.get(senderId);

    return {
      ...chat.toObject(),
      senderDisplayName: sender?.fullName || "Unknown",
      senderAvatar: sender?.avatar || getInitials(sender?.fullName),
    };
  });

  const friendOptions = await getFriendOptions(req.account);

  res.render("pages/rooms", {
    ...commonData("rooms"),
    rooms: roomCards,
    selectedRoom,
    chats: roomMessages,
    currentUserId,
    activeRoomId,
    friendOptions,
  });
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
  res.render("pages/users", {
    ...commonData("discover"),
    strangers: strangers,
    friendRequests: friendRequests,
  });
};

module.exports.friendsPage = async (req, res) => {
  const friends = await Account.find({ _id: { $in: req.account.friendList } });
  const friendsWithPresence = friends.map((friend) => {
    const friendData = friend.toObject();
    const friendId = String(friendData._id);
    const initials = String(friendData.fullName || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();

    return {
      ...friendData,
      id: friendId,
      avatar: friendData.avatar || initials || "?",
      isOnline: presenceStore.isOnline(friendId),
      lastMessage: "Bắt đầu cuộc trò chuyện",
    };
  });

  const activeFriendId = req.query.friendId || friendsWithPresence[0]?.id;

  const chats = activeFriendId
    ? await Chat.find({
        $and: [
          {
            $or: [
              { senderId: req.account.id, receiverId: activeFriendId },
              { senderId: activeFriendId, receiverId: req.account.id },
            ],
          },
          {
            $or: [
              { chatType: "direct" },
              { chatType: { $exists: false } },
              { chatType: null },
            ],
          },
        ],
      }).sort({ createdAt: 1 })
    : [];

  res.render("pages/friends", {
    ...commonData("friends"),
    allFriends: friendsWithPresence,
    chats: chats,
    currentUserId: req.account.id,
    activeFriendId: activeFriendId,
  });
};

module.exports.requestsSentPage = async (req, res) => {
  const sendRequests = await Account.find({
    _id: { $in: req.account.requestedFriends },
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

  res.render("pages/requests-received", {
    ...commonData("requests-received"),
    users: receivedRequests,
  });
};

module.exports.roomsPage = async (req, res) => {
  await renderRoomsPage(req, res);
};

module.exports.roomDetailPage = async (req, res) => {
  const roomId = normalizeId(req.params.roomId);
  if (!isValidObjectId(roomId)) {
    return res.redirect("/chat/rooms");
  }

  const room = await Room.findById(roomId);

  const roomMemberIds = (room?.members || []).map((id) => normalizeId(id));
  if (!room || !roomMemberIds.includes(normalizeId(req.account.id))) {
    return res.redirect("/chat/rooms");
  }

  await renderRoomsPage(req, res, roomId);
};

module.exports.createRoomPost = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const currentUserId = normalizeId(req.account.id);
  const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
  const normalizedMemberIds = [
    ...new Set(memberIds.map((id) => normalizeId(id)).filter(Boolean)),
  ];

  if (!name) {
    return res.json({
      code: "error",
      message: "Tên phòng không được để trống",
    });
  }

  const invalidMemberIds = normalizedMemberIds.filter((id) => !isValidObjectId(id));
  if (invalidMemberIds.length) {
    return res.json({
      code: "error",
      message: "Danh sách thành viên không hợp lệ",
    });
  }

  const inviterFriendList = (req.account.friendList || []).map((id) =>
    normalizeId(id),
  );
  const nonFriendIds = normalizedMemberIds.filter(
    (memberId) => !inviterFriendList.includes(memberId),
  );

  if (nonFriendIds.length) {
    return res.json({
      code: "error",
      message: "Chỉ có thể mời người nằm trong friendList",
    });
  }

  const memberSet = new Set([currentUserId, ...normalizedMemberIds]);
  const finalMemberIds = [...memberSet];

  const existingMembers = await Account.find({
    _id: { $in: finalMemberIds },
  }).select("_id");

  if (existingMembers.length !== finalMemberIds.length) {
    return res.json({
      code: "error",
      message: "Có thành viên không tồn tại",
    });
  }

  const newRoom = new Room({
    name,
    creatorId: currentUserId,
    members: finalMemberIds,
    admins: [currentUserId],
  });
  await newRoom.save();

  const io = global._io;
  if (io) {
    finalMemberIds.forEach((memberId) => {
      io.to(`user:${memberId}`).emit("SERVER_ROOM_CREATED", {
        roomId: normalizeId(newRoom._id),
      });
    });
  }

  return res.json({
    code: "success",
    message: "Tạo phòng chat thành công",
    roomId: normalizeId(newRoom._id),
  });
};

module.exports.inviteMembersPost = async (req, res) => {
  const currentUserId = normalizeId(req.account.id);
  const roomId = normalizeId(req.params.roomId);
  const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
  const normalizedMemberIds = [
    ...new Set(memberIds.map((id) => normalizeId(id)).filter(Boolean)),
  ];

  if (!isValidObjectId(roomId)) {
    return res.json({
      code: "error",
      message: "Phòng chat không hợp lệ",
    });
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return res.json({
      code: "error",
      message: "Không tìm thấy phòng chat",
    });
  }

  const roomMemberIds = (room.members || []).map((id) => normalizeId(id));
  if (!roomMemberIds.includes(currentUserId)) {
    return res.json({
      code: "error",
      message: "Bạn không phải thành viên của phòng chat",
    });
  }

  const roomAdminIds = (room.admins || []).map((id) => normalizeId(id));
  if (!roomAdminIds.includes(currentUserId)) {
    return res.json({
      code: "error",
      message: "Bạn không có quyền mời thành viên",
    });
  }

  if (!normalizedMemberIds.length) {
    return res.json({
      code: "error",
      message: "Vui lòng chọn ít nhất một thành viên",
    });
  }

  const invalidMemberIds = normalizedMemberIds.filter((id) => !isValidObjectId(id));
  if (invalidMemberIds.length) {
    return res.json({
      code: "error",
      message: "Danh sách thành viên không hợp lệ",
    });
  }

  const inviterFriendList = (req.account.friendList || []).map((id) =>
    normalizeId(id),
  );
  const nonFriendIds = normalizedMemberIds.filter(
    (memberId) => !inviterFriendList.includes(memberId),
  );

  if (nonFriendIds.length) {
    return res.json({
      code: "error",
      message: "Chỉ có thể mời người nằm trong friendList",
    });
  }

  const existingMemberSet = new Set((room.members || []).map((id) => normalizeId(id)));
  const newMemberIds = normalizedMemberIds.filter((id) => !existingMemberSet.has(id));

  if (!newMemberIds.length) {
    return res.json({
      code: "error",
      message: "Các thành viên đã tồn tại trong phòng chat",
    });
  }

  const existingMembers = await Account.find({
    _id: { $in: newMemberIds },
  }).select("_id");

  if (existingMembers.length !== newMemberIds.length) {
    return res.json({
      code: "error",
      message: "Có thành viên không tồn tại",
    });
  }

  await Room.updateOne(
    { _id: roomId },
    {
      $addToSet: {
        members: { $each: newMemberIds },
      },
    },
  );

  const io = global._io;
  if (io) {
    [...new Set([...roomMemberIds, ...newMemberIds])].forEach((memberId) => {
      io.to(`user:${normalizeId(memberId)}`).emit("SERVER_ROOM_UPDATED", {
        roomId,
        type: "membership",
      });
    });
  }

  return res.json({
    code: "success",
    message: "Mời thành viên thành công",
    roomId,
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
