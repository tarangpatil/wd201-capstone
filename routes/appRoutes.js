const express = require("express");
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");
const { User, Course, Chapter } = require("../models");

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
      const allCourses = await Course.findAll({ include: User });
      if (req.user.userType === "educator") {
        res.render("dashboard", {
          csrfToken: req.csrfToken(),
          firstName: req.user.firstName,
          userType: req.user.userType,
          lastName: req.user.lastName,
          myCourses: allCourses.filter(
            (course) => course.User.id === req.user.id
          ),
        });
      } else {
        res.render("dashboard", {
          csrfToken: req.csrfToken(),
          firstName: req.user.firstName,
          userType: req.user.userType,
          lastName: req.user.lastName,
          myCourses: allCourses,
        });
      }
    }
  }
);

router.get(
  "/courses/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.userType !== "educator") {
      res.send(
        `<h3 style="text-align:center">Sign in as an educator to create courses<br /><a href="/login">Click to login</a></h3>`
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

router.delete("/course", async (req, res) => {
  try {
    const course = await Course.findByPk(req.body.courseId);
    await course.destroy();
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
  }
});

router.get("/courses/:id", async (req, res) => {
  const courseID = req.params.id;
  const course = await Course.findByPk(courseID);
  if (!req.user) {
    return res.render("courses/coursePage", {
      courseID: courseID,
      name: course.name,
      courseOwner: false,
      csrfToken: req.csrfToken(),
    });
  }
  const chapters = await Chapter.findAll({
    where: {
      courseId: courseID,
    },
  });
  res.render("courses/coursePage", {
    csrfToken: req.csrfToken(),
    courseID,
    chapters,
    name: course.name,
    courseOwner: req.user.id === course.userId,
  });
});

router.get(
  "/courses/:id/chapters/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.userType === "educator") {
      const courseName = (await Course.findByPk(req.params.id)).name;
      res.render("chapters/createChapter.ejs", {
        csrfToken: req.csrfToken(),
        courseName,
        courseId: req.params.id,
      });
    } else
      res.send(
        `<h3 style="text-align:center">Sign in as an educator to create courses<br /><a href="/login">Click to login</a></h3>`
      );
  }
);

router.post(
  "/chapter",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      if (req.user.userType !== "educator") return res.redirect("/login");
      const { courseId, name, description } = req.body;
      console.log(req.body);
      const chapter = await Chapter.create({
        courseId,
        name,
        description,
      });
      res.redirect(`/courses/${courseId}/`);
    } catch (err) {
      res.status(403).json(err);
    }
  }
);

router.delete(
  "/chapter",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const chapterId = req.body.id;
    return res.json(chapterId);
  }
);

module.exports = router;
