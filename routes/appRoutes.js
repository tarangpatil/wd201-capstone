const express = require("express");
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");
const { User, Course, Chapter, Page } = require("../models");

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

router.get(
  "/chapters/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const chapter = await Chapter.findByPk(req.params.id);
    const course = await Course.findByPk(chapter.courseId);
    const pages = (
      await Page.findAll({
        where: {
          chapterId: chapter.dataValues.id,
        },
      })
    ).map((page) => page.dataValues);

    res.render("chapters/chapterPage", {
      ...chapter.dataValues,
      csrfToken: req.csrfToken(),
      courseOwner: req.user.id === course.userId,
      chapterId: chapter.id,
      pages,
    });
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
    try {
      const chapterId = req.body.id;
      const chapter = await Chapter.findByPk(chapterId);
      const courseId = chapter.dataValues.courseId;
      chapter.destroy();
      return res.redirect(`/courses/${courseId}`);
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  }
);

router.get(
  "/chapter/:id/pages/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const chapter = await Chapter.findByPk(req.params.id);
    res.render("pages/createPage", {
      chapterId: chapter.id,
      chapterName: chapter.dataValues.name,
      csrfToken: req.csrfToken(),
      chapterId: chapter.id,
    });
  }
);

router.get(
  "/pages/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const page = await Page.findByPk(req.params.id, { include: Chapter });
    const course = await Course.findByPk(page.Chapter.courseId, {
      include: User,
    });
    console.log("content", page.content);
    res.render("pages/pagePage", {
      csrfToken: req.csrfToken(),
      name: page.dataValues.name,
      pageId: page.id,
      courseId: course.id,
      content: page.dataValues.content,
      courseOwner: req.user.id === course.userId,
    });
  }
);

router.post("/page", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const { name, content, chapterId } = req.body;
  const newPage = await Page.create({
    name,
    content,
    chapterId,
  });
  res.redirect(`/chapters/${chapterId}`);
});

router.delete(
  "/page",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const { id } = req.body;
    const page = await Page.findByPk(id);
    const chapterId = page.dataValues.chapterId;
    await page.destroy();
    res.redirect(`/chapters/${chapterId}`);
  }
);

module.exports = router;
