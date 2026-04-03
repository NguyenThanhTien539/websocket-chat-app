var socket = io();

var socket = io();

const formContent = document.querySelector("#chat-composer");
const friendCards = document.querySelectorAll(".list-card");

let receiverId =
  document.querySelector(".list-card.active")?.dataset.userId || null;

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

socket.on("SERVER_SEND_MESSAGE", (data) => {
  console.log("Message received from server: ", data);
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
