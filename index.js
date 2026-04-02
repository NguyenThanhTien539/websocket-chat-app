const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT;
const databaseConfig = require("./config/database.config");

databaseConfig.connect();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on: http://localhost:${port}`);
});
