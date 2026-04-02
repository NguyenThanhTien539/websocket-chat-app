const mongoose = require("mongoose");

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Connected successfully");
  } catch (error) {
    console.log("ERROR when connecting to database");
  }
};
