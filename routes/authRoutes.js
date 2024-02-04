const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcrypt");
const { User } = require("../models");

const saltRounds = 10;

router.get("/login", async (req, res) => {
  return res.render("login", { csrfToken: req.csrfToken() });
});

router.get("/signup", async (req, res) => {
  return res.render("signup", { csrfToken: req.csrfToken() });
});

router.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.post("/users", async (req, res) => {
  const hashPwd = await bcrypt.hash(req.body.password, saltRounds);
  try {
    if (req.body.password === "") {
      throw new Error("Validation notEmpty on password failed");
    }
    console.log("Creating user: ", req.body);
    let user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      userType: req.body.userType,
      password: hashPwd,
    });
    console.log("User created:", user.dataValues);
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.status(301).redirect("/dashboard");
    });
  } catch (error) {
    console.log(error.errors[0].message);
    res.status(401).json({ message: error.errors[0].message });
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    res.redirect("/dashboard");
  }
);

module.exports = router;
