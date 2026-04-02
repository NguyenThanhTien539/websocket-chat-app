const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT;
const databaseConfig = require("./config/database.config");
const indexRoute = require("./routes/index.route");

app.set("views", `${__dirname}/views`); // Tìm đến thư mục tên là views
app.set("view engine", "pug"); // template engine sử dụng: pug

app.use(express.static(`${__dirname}/public`)); // Thiết lập thư mục chứa file tĩnh

databaseConfig.connect();

app.use("/", indexRoute);

app.listen(port, () => {
  console.log(`Server is running on: http://localhost:${port}`);
});
