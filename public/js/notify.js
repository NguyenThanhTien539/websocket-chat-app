var notify = new Notyf({
  duration: 3000,
  position: {
    x: "right",
    y: "top",
  },
  dismissible: true,
});

let existNotification = sessionStorage.getItem("notify");
if (existNotification) {
  existNotification = JSON.parse(existNotification);
  if (existNotification.code === "error") {
    notify.error(existNotification.message);
  } else {
    notify.success(existNotification.message);
  }
  sessionStorage.removeItem("notify");
}

const setNotificationInSession = (code, message) => {
  sessionStorage.setItem(
    "notify",
    JSON.stringify({
      code: code,
      message: message,
    }),
  );
};
