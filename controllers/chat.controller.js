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
  _io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
  });

  res.render("pages/dashboard", dashboardViewData());
};

module.exports.discoverPage = (req, res) => {
  res.render("pages/users", commonData("discover"));
};

module.exports.friendsPage = (req, res) => {
  res.render("pages/friends", commonData("friends"));
};

module.exports.requestsSentPage = (req, res) => {
  res.render("pages/requests-sent", commonData("requests-sent"));
};

module.exports.requestsReceivedPage = (req, res) => {
  res.render("pages/requests-received", commonData("requests-received"));
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
