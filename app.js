const express = require("express");
const app = express();
const router = require("./routes/appRoutes");

app.use(router);
app.set("view engine", "ejs");


module.exports = app;
