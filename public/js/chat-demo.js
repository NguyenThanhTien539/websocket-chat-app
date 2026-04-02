const composerInput = document.querySelector(".chat-composer input");
const typingRow = document.querySelector(".typing-row span");

if (composerInput && typingRow) {
  composerInput.addEventListener("input", () => {
    if (composerInput.value.trim().length > 0) {
      typingRow.textContent = "Bạn đang nhập...";
      return;
    }

    typingRow.textContent = "Hoang Pham đang nhập...";
  });
}
