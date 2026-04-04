var socket = io();

const formContent = document.querySelector("#chat-composer");
const friendCards = document.querySelectorAll(".list-card");
const chatMainPanel = document.querySelector(".chat-main-panel");
const messageList = document.querySelector(".chat-messages");

const currentUserId = chatMainPanel?.dataset.currentUserId || null;
const activeFriendId = chatMainPanel?.dataset.activeFriendId || null;
const activeFriendAvatar = chatMainPanel?.dataset.activeFriendAvatar || "?";

let receiverId =
  document.querySelector(".list-card.active")?.dataset.userId || null;

if (messageList) {
  messageList.scrollTop = messageList.scrollHeight;
}

if (formContent) {
  const composerInput =
    formContent.querySelector('input[name="content"]') ||
    formContent.querySelector(".form-control");
  const emojiButton = formContent.querySelector(
    ".btn-icon i.bi-emoji-smile",
  )?.parentElement;

  if (composerInput && emojiButton) {
    const pickerPanel = document.createElement("div");
    pickerPanel.className = "emoji-picker-panel d-none";

    const picker = document.createElement("emoji-picker");
    pickerPanel.appendChild(picker);
    formContent.appendChild(pickerPanel);

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
}

friendCards.forEach((card) => {
  card.addEventListener("click", () => {
    friendCards.forEach((item) => item.classList.remove("active"));

    card.classList.add("active");
    receiverId = card.dataset.userId;
  });
});

if (formContent) {
  formContent.addEventListener("submit", (event) => {
    event.preventDefault();

    const content = formContent.content.value.trim();

    if (!receiverId) {
      alert("Vui lòng chọn người nhận");
      return;
    }

    if (!content) return;

    const data = {
      content: content,
      receiverId: receiverId,
    };

    socket.emit("CLIENT_SEND_MESSAGE", data);
    formContent.content.value = "";
  });
}

function formatMessageTime(createdAt) {
  const date = createdAt ? new Date(createdAt) : new Date();

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function appendMessageToUI(data) {
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

socket.on("SERVER_SEND_MESSAGE", (data) => {
  if (!currentUserId || !activeFriendId) return;

  const isCurrentConversation =
    (String(data.senderId) === String(currentUserId) &&
      String(data.receiverId) === String(activeFriendId)) ||
    (String(data.senderId) === String(activeFriendId) &&
      String(data.receiverId) === String(currentUserId));

  if (!isCurrentConversation) return;

  appendMessageToUI(data);
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest(".add-friend-btn");
  if (addButton) {
    const userIdOfFriend = addButton.getAttribute("data-user-id");
    const cardBody = addButton.closest(".people-card__body");

    if (cardBody) {
      cardBody.classList.add("add");
    } else {
      // requests-sent UI: switch "Kết bạn" back to "Hủy lời mời"
      addButton.classList.remove("add-friend-btn", "btn-primary");
      addButton.classList.add("cancel-friend-btn", "btn-outline-secondary");
      addButton.textContent = "Hủy lời mời";
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
    // requests-sent UI: when cancel is clicked, show "Kết bạn"
    cancelButton.classList.remove("cancel-friend-btn", "btn-outline-secondary");
    cancelButton.classList.add("add-friend-btn", "btn-primary");
    cancelButton.textContent = "Kết bạn";
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

      // Ẩn nút "Đã từ chối" khi nhấn "Chấp nhận"
      const actionBox = button.closest(".list-card__right");
      if (actionBox) {
        const declineButton = actionBox.querySelector(".decline-friend-btn");
        if (declineButton) {
          declineButton.style.display = "none";
        }
      }
      // Đổi giao diện nút "Chấp nhận" thành "Đã chấp nhận"
      button.classList.remove("accept-friend-btn", "btn-primary");
      button.classList.add("accepted-friend-btn", "btn-success");
      button.textContent = "Đã chấp nhận";
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
          // Ẩn nút "Chấp nhận" khi nhấn "Đã từ chối"
          acceptButton.style.display = "none";
        }
      }

      button.classList.remove("decline-friend-btn", "btn-light");
      button.classList.add("declined-friend-btn", "btn-secondary");
      button.textContent = "Đã từ chối";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    });
  });
}
