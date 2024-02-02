const express = require("express");
const app = express();
const router = require("./router/appRoutes");
app.use(router);

module.exports = app;
