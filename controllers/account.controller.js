const { Account } = require("../models/account.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports.login = (req, res) => {
  res.render("pages/login", {
    pageTitle: "Đăng nhập - BlinkChat",
    pageStyles: ["auth.css"],
  });
};

module.exports.loginPost = async (req, res) => {
  const { email, password } = req.body;
  const existAccount = await Account.findOne({ email: email });

  if (!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thông",
    });
    return;
  }

  const isPasswordValidate = await bcrypt.compare(
    password,
    existAccount.password,
  );

  if (!isPasswordValidate) {
    res.json({
      code: "error",
      message: "Mật khẩu không đúng",
    });
    return;
  }

  const token = jwt.sign(
    {
      id: existAccount.id,
      email: existAccount.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  res.cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
  });

  res.json({
    code: "success",
    message: "Đăng nhập thành công",
  });
  return;
};

module.exports.register = (req, res) => {
  res.render("pages/register", {
    pageTitle: "Đăng ký - BlinkChat",
    pageStyles: ["auth.css"],
  });
};

module.exports.registerPost = async (req, res) => {
  const existAccount = await Account.findOne({ email: req.body.email });

  if (existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống",
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  req.body = {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
  };

  const newAccount = new Account(req.body);
  await newAccount.save();

  res.json({
    code: "success",
    message: "Đăng ký tài khoản thành công",
  });
};

module.exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({
    code: "success",
    message: "Bạn đã đăng xuất thành công",
  });
  
};
