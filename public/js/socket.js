var socket = io();

const chatMainPanel = document.querySelector(".chat-main-panel");
const messageList = document.querySelector(".chat-messages");
const chatType = chatMainPanel?.dataset.chatType || "direct";

const currentUserId = chatMainPanel?.dataset.currentUserId || null;

const activeFriendId = chatMainPanel?.dataset.activeFriendId || null;
const activeFriendAvatar = chatMainPanel?.dataset.activeFriendAvatar || "?";
const activeFriendName = chatMainPanel?.dataset.activeFriendName || "Ban be";
const activeFriendAvatarElement = document.querySelector("#active-friend-avatar");
const activeFriendStatusElement = document.querySelector("#active-friend-status");
const typingIndicator = document.querySelector("#typing-indicator");
const typingIndicatorText =
  typingIndicator?.querySelector(".typing-row__text") || null;

const activeRoomId = chatMainPanel?.dataset.activeRoomId || null;

const directForm = document.querySelector("#chat-composer");
const roomForm = document.querySelector("#room-chat-composer");
let isCreatingRoom = false;

let receiverId =
  document.querySelector(".list-card.active")?.dataset.userId || null;

if (messageList) {
  messageList.scrollTop = messageList.scrollHeight;
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function setTypingIndicator(isTyping) {
  if (!typingIndicator || !typingIndicatorText) return;

  if (isTyping) {
    typingIndicatorText.textContent = activeFriendName;
    typingIndicator.classList.remove("d-none");
    return;
  }

  typingIndicator.classList.add("d-none");
}

function updatePresenceUI(userId, isOnline) {
  if (!userId) return;

  const avatarElements = document.querySelectorAll(
    `[data-presence-avatar="${userId}"]`,
  );
  avatarElements.forEach((element) => {
    element.classList.toggle("is-online", Boolean(isOnline));
  });

  const labelElements = document.querySelectorAll(
    `[data-presence-label="${userId}"]`,
  );
  labelElements.forEach((element) => {
    element.classList.toggle("is-online", Boolean(isOnline));
    element.classList.toggle("is-offline", !isOnline);
    element.textContent = isOnline ? "Online" : "Offline";
  });

  if (String(activeFriendId) === String(userId)) {
    activeFriendAvatarElement?.classList.toggle("is-online", Boolean(isOnline));
    if (activeFriendStatusElement) {
      activeFriendStatusElement.textContent = isOnline ? "Online" : "Offline";
    }
  }
}

function setupEmojiPicker(formElement) {
  if (!formElement) return;

  const composerInput =
    formElement.querySelector('input[name="content"]') ||
    formElement.querySelector(".form-control");
  const emojiButton = formElement.querySelector(
    ".btn-icon i.bi-emoji-smile",
  )?.parentElement;

  if (!composerInput || !emojiButton) return;

  const pickerPanel = document.createElement("div");
  pickerPanel.className = "emoji-picker-panel d-none";

  const picker = document.createElement("emoji-picker");
  pickerPanel.appendChild(picker);
  formElement.appendChild(pickerPanel);

  emojiButton.addEventListener("click", (event) => {
    event.preventDefault();
    pickerPanel.classList.toggle("d-none");
  });

  picker.addEventListener("emoji-click", (event) => {
    composerInput.value += event.detail.unicode;
    composerInput.focus();
  });

  document.addEventListener("click", (event) => {
    if (
      !pickerPanel.classList.contains("d-none") &&
      !pickerPanel.contains(event.target) &&
      !emojiButton.contains(event.target)
    ) {
      pickerPanel.classList.add("d-none");
    }
  });
}

setupEmojiPicker(directForm);
setupEmojiPicker(roomForm);

const friendCards = document.querySelectorAll(".list-card[data-user-id]");
friendCards.forEach((card) => {
  card.addEventListener("click", () => {
    friendCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    receiverId = card.dataset.userId;
  });
});

if (directForm) {
  const composerInput =
    directForm.querySelector('input[name="content"]') ||
    directForm.querySelector(".form-control");
  let typingTimeoutId = null;
  let hasTypingState = false;

  const emitTyping = (isTyping) => {
    if (!receiverId || !currentUserId) return;

    socket.emit("CLIENT_TYPING", {
      receiverId,
      isTyping,
    });
  };

  if (composerInput) {
    composerInput.addEventListener("keyup", () => {
      const hasValue = composerInput.value.trim().length > 0;

      if (hasValue && !hasTypingState) {
        hasTypingState = true;
        emitTyping(true);
      }

      if (!hasValue && hasTypingState) {
        hasTypingState = false;
        emitTyping(false);
        setTypingIndicator(false);
      }

      clearTimeout(typingTimeoutId);
      typingTimeoutId = setTimeout(() => {
        if (!hasTypingState) return;
        hasTypingState = false;
        emitTyping(false);
        setTypingIndicator(false);
      }, 1200);
    });

    composerInput.addEventListener("blur", () => {
      if (!hasTypingState) return;
      hasTypingState = false;
      emitTyping(false);
      setTypingIndicator(false);
    });
  }

  directForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const content = directForm.content.value.trim();

    if (!receiverId) {
      alert("Vui long chon nguoi nhan");
      return;
    }

    if (!content) return;

    socket.emit("CLIENT_SEND_MESSAGE", {
      content,
      receiverId,
    });

    directForm.content.value = "";

    if (hasTypingState) {
      hasTypingState = false;
      emitTyping(false);
      setTypingIndicator(false);
    }
    clearTimeout(typingTimeoutId);
  });
}

if (chatType === "room" && activeRoomId) {
  socket.emit("CLIENT_JOIN_ROOM", { roomId: activeRoomId });
}

if (roomForm) {
  roomForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const content = roomForm.content.value.trim();
    if (!activeRoomId || !content) return;

    socket.emit("CLIENT_SEND_ROOM_MESSAGE", {
      roomId: activeRoomId,
      content,
    });

    roomForm.content.value = "";
  });
}

function formatMessageTime(createdAt) {
  const date = createdAt ? new Date(createdAt) : new Date();

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function appendDirectMessageToUI(data) {
  if (!messageList || !currentUserId) return;

  const isMine = String(data.senderId) === String(currentUserId);
  const messageRow = document.createElement("article");
  messageRow.className = `message-row${isMine ? " is-me" : ""}`;

  if (!isMine) {
    const avatar = document.createElement("div");
    avatar.className = "chat-avatar chat-avatar--sm";
    avatar.textContent = activeFriendAvatar;
    messageRow.appendChild(avatar);
  }

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = data.content;

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const time = document.createElement("span");
  time.textContent = formatMessageTime(data.createdAt);
  meta.appendChild(time);

  contentWrapper.appendChild(bubble);
  contentWrapper.appendChild(meta);
  messageRow.appendChild(contentWrapper);
  messageList.appendChild(messageRow);

  messageList.scrollTop = messageList.scrollHeight;
}

function appendRoomMessageToUI(data) {
  if (!messageList || !currentUserId) return;

  const isMine = String(data.senderId) === String(currentUserId);
  const messageRow = document.createElement("article");
  messageRow.className = `message-row${isMine ? " is-me" : ""}`;

  if (!isMine) {
    const avatar = document.createElement("div");
    avatar.className = "chat-avatar chat-avatar--sm";
    avatar.textContent = getInitials(data.fullName);
    messageRow.appendChild(avatar);
  }

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content";

  if (!isMine) {
    const sender = document.createElement("p");
    sender.className = "message-sender";
    sender.textContent = data.fullName || "Unknown";
    contentWrapper.appendChild(sender);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = data.content;

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const time = document.createElement("span");
  time.textContent = formatMessageTime(data.createdAt);
  meta.appendChild(time);

  contentWrapper.appendChild(bubble);
  contentWrapper.appendChild(meta);
  messageRow.appendChild(contentWrapper);
  messageList.appendChild(messageRow);

  messageList.scrollTop = messageList.scrollHeight;
}

socket.on("SERVER_SEND_MESSAGE", (data) => {
  if (!currentUserId || !activeFriendId || chatType !== "direct") return;

  const isCurrentConversation =
    (String(data.senderId) === String(currentUserId) &&
      String(data.receiverId) === String(activeFriendId)) ||
    (String(data.senderId) === String(activeFriendId) &&
      String(data.receiverId) === String(currentUserId));

  if (!isCurrentConversation) return;

  if (String(data.senderId) === String(activeFriendId)) {
    setTypingIndicator(false);
  }
  appendDirectMessageToUI(data);
});

socket.on("SERVER_SEND_ROOM_MESSAGE", (data) => {
  if (chatType !== "room" || !activeRoomId) return;
  if (String(data.roomId) !== String(activeRoomId)) return;

  appendRoomMessageToUI(data);
});

socket.on("SERVER_ROOM_ERROR", (data = {}) => {
  if (!data.message) return;

  if (typeof notify !== "undefined") {
    notify.error(data.message);
    return;
  }

  alert(data.message);
});

socket.on("SERVER_TYPING", (data) => {
  if (!currentUserId || !activeFriendId || chatType !== "direct") return;

  const isCurrentConversation =
    String(data.senderId) === String(activeFriendId) &&
    String(data.receiverId) === String(currentUserId);

  if (!isCurrentConversation) return;

  setTypingIndicator(Boolean(data.isTyping));
});

socket.on("SERVER_ONLINE_FRIENDS", (data = {}) => {
  const onlineFriendIds = Array.isArray(data.friendIds) ? data.friendIds : [];

  onlineFriendIds.forEach((userId) => {
    updatePresenceUI(String(userId), true);
  });
});

socket.on("SERVER_FRIEND_PRESENCE_CHANGED", (data = {}) => {
  const changedUserId = String(data.userId || "").trim();
  if (!changedUserId) return;

  updatePresenceUI(changedUserId, Boolean(data.isOnline));
});

socket.on("SERVER_ROOM_CREATED", (data = {}) => {
  if (!data.roomId) return;

  if (chatType === "room" && !isCreatingRoom) {
    window.location.reload();
  }
});

socket.on("SERVER_ROOM_UPDATED", (data = {}) => {
  if (chatType !== "room") return;

  const changedRoomId = String(data.roomId || "").trim();
  if (!changedRoomId) return;

  if (String(changedRoomId) === String(activeRoomId) && data.type === "message") {
    return;
  }

  window.location.reload();
});

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((input) => input.checked)
    .map((input) => String(input.value || "").trim())
    .filter(Boolean);
}

const createRoomButton = document.querySelector("#submit-create-room");
if (createRoomButton) {
  createRoomButton.addEventListener("click", async () => {
    try {
      isCreatingRoom = true;
      const roomNameInput = document.querySelector("#roomName");
      const name = String(roomNameInput?.value || "").trim();
      const memberIds = getCheckedValues('input[name="memberIds"]');

      const data = await postJson("/chat/rooms", {
        name,
        memberIds,
      });

      if (data.code === "success") {
        if (typeof setNotificationInSession === "function") {
          setNotificationInSession("success", data.message);
        }
        window.location.href = `/chat/rooms/${data.roomId}`;
        return;
      }

      if (typeof notify !== "undefined") {
        notify.error(data.message || "Khong the tao phong chat");
      }
      isCreatingRoom = false;
    } catch (error) {
      isCreatingRoom = false;
      if (typeof notify !== "undefined") {
        notify.error("Khong the tao phong chat");
      }
    }
  });
}

const inviteRoomButton = document.querySelector("#submit-invite-room");
if (inviteRoomButton) {
  inviteRoomButton.addEventListener("click", async () => {
    try {
      const roomId = inviteRoomButton.dataset.roomId;
      const memberIds = getCheckedValues('input[name="inviteMemberIds"]');

      const data = await postJson(`/chat/rooms/${roomId}/invite`, {
        memberIds,
      });

      if (data.code === "success") {
        if (typeof setNotificationInSession === "function") {
          setNotificationInSession("success", data.message);
        }
        window.location.reload();
        return;
      }

      if (typeof notify !== "undefined") {
        notify.error(data.message || "Khong the moi thanh vien");
      }
    } catch (error) {
      if (typeof notify !== "undefined") {
        notify.error("Khong the moi thanh vien");
      }
    }
  });
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest(".add-friend-btn");
  if (addButton) {
    const userIdOfFriend = addButton.getAttribute("data-user-id");
    const cardBody = addButton.closest(".people-card__body");

    if (cardBody) {
      cardBody.classList.add("add");
    } else {
      addButton.classList.remove("add-friend-btn", "btn-primary");
      addButton.classList.add("cancel-friend-btn", "btn-outline-secondary");
      addButton.textContent = "Huy loi moi";
    }

    if (userIdOfFriend) {
      socket.emit("CLIENT_SEND_FRIEND_REQUEST", { toUserId: userIdOfFriend });
    }

    return;
  }

  const cancelButton = event.target.closest(".cancel-friend-btn");
  if (!cancelButton) {
    return;
  }

  const userIdOfFriend = cancelButton.getAttribute("data-user-id");
  const cardBody = cancelButton.closest(".people-card__body");

  if (cardBody) {
    cardBody.classList.remove("add");
  } else {
    cancelButton.classList.remove("cancel-friend-btn", "btn-outline-secondary");
    cancelButton.classList.add("add-friend-btn", "btn-primary");
    cancelButton.textContent = "Ket ban";
  }

  if (userIdOfFriend) {
    socket.emit("CLIENT_CANCEL_FRIEND_REQUEST", { toUserId: userIdOfFriend });
  }
});

const acceptButtons = document.querySelectorAll(".accept-friend-btn");
if (acceptButtons) {
  acceptButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const userIdOfFriend = button.getAttribute("data-user-id");
      if (userIdOfFriend) {
        socket.emit("CLIENT_ACCEPT_FRIEND_REQUEST", {
          toUserId: userIdOfFriend,
        });
      }

      const actionBox = button.closest(".list-card__right");
      if (actionBox) {
        const declineButton = actionBox.querySelector(".decline-friend-btn");
        if (declineButton) {
          declineButton.style.display = "none";
        }
      }

      button.classList.remove("accept-friend-btn", "btn-primary");
      button.classList.add("accepted-friend-btn", "btn-success");
      button.textContent = "Da chap nhan";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    });
  });
}

const declineButtons = document.querySelectorAll(".decline-friend-btn");
if (declineButtons) {
  declineButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const userIdOfFriend = button.getAttribute("data-user-id");
      if (userIdOfFriend) {
        socket.emit("CLIENT_DECLINE_FRIEND_REQUEST", {
          toUserId: userIdOfFriend,
        });
      }

      const actionBox = button.closest(".list-card__right");
      if (actionBox) {
        const acceptButton = actionBox.querySelector(".accept-friend-btn");
        if (acceptButton) {
          acceptButton.style.display = "none";
        }
      }

      button.classList.remove("decline-friend-btn", "btn-light");
      button.classList.add("declined-friend-btn", "btn-secondary");
      button.textContent = "Da tu choi";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    });
  });
}
