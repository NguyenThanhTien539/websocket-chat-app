document.querySelectorAll(".chat-menu-item").forEach((item) => {
  item.addEventListener("mouseenter", () => {
    item.classList.add("is-hover");
  });

  item.addEventListener("mouseleave", () => {
    item.classList.remove("is-hover");
  });
});
