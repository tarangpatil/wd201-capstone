const express = require("express");
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");
const { User, Course } = require("../models");

router.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  } else {
    res.render("index", { csrfToken: req.csrfToken() });
  }
});

router.get(
  "/dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.isAuthenticated()) {
      const myCourses = (await Course.findAll({ include: User })).map(
        (course) => ({
          name: course.dataValues.name,
          author: `${course.User.firstName} ${course.User.lastName}`,
          strength: 100,
          id: course.id,
        })
      );
      console.log(myCourses);
      res.render("dashboard", {
        firstName: req.user.firstName,
        userType: req.user.userType,
        lastName: req.user.lastName,
        myCourses,
      });
    }
  }
);

router.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get(
  "/courses/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.userType !== "educator") {
      res.send(
        `<h3 class="text-center">Sign in as an educator to create courses<br /><a href="/login">Click to login</a></h3>`
      );
    }
    res.render("courses/createCourse", { csrfToken: req.csrfToken() });
  }
);

router.post(
  "/course",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const { courseName } = req.body;
    const newCourse = await Course.create({
      name: courseName,
      userId: req.user.id,
    });
    res.redirect("/dashboard/");
  }
);

router.get("/courses/:id", async (req, res) => {
  const courseID = req.params.id;
  const course = await Course.findByPk(courseID);
  if (!req.user) {
    return res.render("courses/coursePage", {
      courseID,
      name: course.name,
      courseOwner: false,
    });
  }
  res.render("courses/coursePage", {
    courseID,
    name: course.name,
    courseOwner: req.user.id === courseID,
  });
});

router.get(
  "/courses/:id/chapters/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    res.json(req.params.id);
  }
);

module.exports = router;
