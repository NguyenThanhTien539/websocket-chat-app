var socket = io();

const formContent = document.querySelector("#chat-composer");
if (formContent) {
  formContent.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = formContent.content.value.trim();
    if (content) {
      const data = {
        content: content,
      };
      socket.emit("CLIENT_SEND_MESSAGE", data);
      formContent.content.value = "";
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
