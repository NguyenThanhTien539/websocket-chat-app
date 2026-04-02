const jwt = require("jsonwebtoken");
const { Account } = require("../models/account.model");

module.exports.infoUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Account.findOne({ email: decoded.email });
      if (!user) {
        res.clearCookie("token");
        return res.status(401).json({ message: "Unauthorized" });
      } else {
        res.locals.user = user;
      }
      next();
    } catch (error) {
      console.error("Error in auth middleware:", error);
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  res.locals.user = null;
  next();
};
