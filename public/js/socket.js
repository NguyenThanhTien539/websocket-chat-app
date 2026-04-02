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
