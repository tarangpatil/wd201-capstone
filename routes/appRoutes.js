const express = require("express");
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");
const {
  User,
  Course,
  Chapter,
  Page,
  Enroll,
  MarkComplete,
} = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");

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
      if (req.user.userType === "educator") {
        let myCourses = await Course.findAll({
          where: { userId: req.user.id },
          include: User,
        });
        myCourses = await Promise.all(
          myCourses.map(async (course) => ({
            name: course.name,
            author: `${course.User.firstName} ${course.User.lastName}`,
            id: course.id,
            strength: (
              await Enroll.findAll({
                where: { courseId: course.id },
              })
            ).length,
          }))
        );
        console.log(myCourses);
        res.render("dashboard", {
          csrfToken: req.csrfToken(),
          firstName: req.user.firstName,
          userType: req.user.userType,
          lastName: req.user.lastName,
          myCourses,
        });
      } else {
        let newCourses = await Enroll.findAll({
          where: { userId: req.user.id },
          include: User,
        });
        newCourses = newCourses.map((i) => i.dataValues.courseId);
        newCourses = await Course.findAll({
          where: {
            id: {
              [Op.notIn]: newCourses,
            },
          },
          include: User,
        });
        newCourses = await Promise.all(
          newCourses.map(async (course) => ({
            name: course.name,
            author: `${course.User.firstName} ${course.User.lastName}`,
            id: course.id,
            strength: (
              await Enroll.findAll({
                where: { courseId: course.id },
              })
            ).length,
          }))
        );
        console.log(newCourses);
        let enrolledCourses = await Enroll.findAll({
          where: {
            userId: req.user.id,
          },
          include: [Course, User],
        });
        enrolledCourses = await Promise.all(
          enrolledCourses.map(async (enrollment) => ({
            name: enrollment.dataValues.Course.name,
            author:
              enrollment.dataValues.User.firstName +
              " " +
              enrollment.dataValues.User.lastName,
            id: enrollment.dataValues.Course.id,
            strength: (
              await Enroll.findAll({
                where: { courseId: enrollment.dataValues.Course.id },
              })
            ).length,
          }))
        );
        res.render("dashboard", {
          csrfToken: req.csrfToken(),
          firstName: req.user.firstName,
          userType: req.user.userType,
          lastName: req.user.lastName,
          enrolledCourses,
          newCourses,
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
    if (req.user.userType === "educator") {
      const { courseName } = req.body;
      const newCourse = await Course.create({
        name: courseName,
        userId: req.user.id,
      });
    }
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
      locked: true,
      csrfToken: req.csrfToken(),
    });
  }
  const chapters = await Chapter.findAll({
    where: {
      courseId: courseID,
    },
  });
  const locked =
    (await Enroll.findAll({
      where: {
        courseId: req.params.id,
        userId: req.user.id,
      },
    })) === null;
  res.render("courses/coursePage", {
    csrfToken: req.csrfToken(),
    courseID,
    chapters,
    locked,
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
    let locked =
      (
        await Enroll.findAll({
          where: {
            courseId: course.id,
            userId: req.user.id,
          },
        })
      ).length === 0;
    locked = course.dataValues.userId !== req.user.id && locked;

    if (locked) return res.send("<h1>Enroll to view chapter</h1>");

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
    let locked =
      (
        await Enroll.findAll({
          where: {
            courseId: course.id,
            userId: req.user.id,
          },
        })
      ).length === 0;
    locked = course.dataValues.userId !== req.user.id && locked;

    if (locked) return res.send("<h1>Enroll to view chapter</h1>");
    let pageComplete = await MarkComplete.findAll({
      where: {
        pageId: req.params.id,
        userId: req.user.id,
      },
    });
    pageComplete = pageComplete.length > 0;
    const allPages = await Page.findAll({
      where: {
        chapterId: page.chapterId,
      },
    });
    let pageId = Number(req.params.id);
    let nextPageId = -1;
    let prevPageId = -1;
    for (let i = 0; i < allPages.length; i++) {
      if (allPages[i].id === pageId) {
        if (i !== allPages.length - 1) {
          nextPageId = allPages[i + 1].id;
        }
        if (i !== 0) {
          prevPageId = allPages[i - 1].id;
        }
        break;
      }
    }
    res.render("pages/pagePage", {
      csrfToken: req.csrfToken(),
      name: page.dataValues.name,
      pageId: page.id,
      courseId: course.id,
      content: page.dataValues.content,
      courseOwner: req.user.id === course.userId,
      userType: req.user.userType,
      pageComplete,
      nextPageId,
      prevPageId,
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

router.post(
  "/enroll",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.user.userType === "student") {
      try {
        const userId = req.user.id;
        const courseId = req.body.courseId;
        await Enroll.create({ userId: userId, courseId: courseId });
        res.redirect("/dashboard");
      } catch (error) {
        console.log(error);
        res.status(403).json(error);
      }
    } else {
      res.redirect("/login");
    }
  }
);

router.post(
  "/markComplete",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      if (req.user.userType === "student") {
        const userId = req.user.id;
        const pageId = req.body.id;
        const markComplete = await MarkComplete.create({
          userId,
          pageId,
        });
        console.log(markComplete);
        res.redirect(`/pages/${pageId}`);
      } else res.redirect("/login");
    } catch (error) {
      res.json(error);
    }
  }
);

router.get(
  "/changePassword",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    res.render("changePassword", { csrfToken: req.csrfToken() });
  }
);

router.post(
  "/changePassword",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const { oldPassword, newPassword, newRepassword } = req.body;
    if (newPassword !== newRepassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/changePassword");
    }
    if (newPassword.length < 8) {
      req.flash("error", "Passwords shorter than 8 characters");
      return res.redirect("/changePassword");
    }
    const user = await User.findByPk(req.user.id);
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      req.flash("error", "Wrong old password");
      return res.redirect("/changePassword");
    }
    const newPwdHash = await bcrypt.hash(newPassword, 10);
    await User.update({ password: newPwdHash }, { where: { id: req.user.id } });
    res.redirect("/signout");
  }
);

module.exports = router;
