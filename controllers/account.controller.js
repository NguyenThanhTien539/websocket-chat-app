module.exports.login = (req, res) => {
  console.log("Login request received with data:", req.body);
  res.json({
    code: "success",
    message: "Đăng nhập thành công!",
  });
};

module.exports.register = (req, res) => {
  console.log("Register request received with data:", req.body);
  res.json({
    code: "success",
    message: "Đăng ký thành công!",
  });
};
