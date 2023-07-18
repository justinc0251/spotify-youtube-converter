const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get("/api", (req, res) => {
  res.json({
    users: ["userOne", "userTwo", "userThree", "userFour"],
  });
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
