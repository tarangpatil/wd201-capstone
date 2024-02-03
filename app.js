// const csurf = require("tiny-csrf");
// const cookieParser = require("cookie-parser");
// const express = require("express");
// const app = express();
// const { User, Course } = require("./models");

// //User Authentication
// const passport = require("passport");
// const connectEnsureLogin = require("connect-ensure-login");
// const session = require("express-session");
// const flash = require("connect-flash");
// const LocalStrategy = require("passport-local");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const path = require("path");

// app.use(express.static(__dirname + "/public"));
// app.use(express.json());
// app.set("views", path.join(__dirname, "views"));
// app.use(express.urlencoded({ extended: false }));
// app.set("view engine", "ejs");
// app.use(cookieParser("n*_h!bR?tr1t095a*l&1Tr0d7QAsPlcI"));
// app.use(flash());
// app.use(
//   session({
//     secret: "3!i9O1Ithi_uxl$$uB2uSt32aMa*0Ige",
//     cookie: { maxAge: 24 * 60 * 60 * 1000 },
//   })
// );
// app.use(csurf("trofrUzA?rUzu2rLP4Lv&pif$lXepHAv", ["POST", "PUT", "DELETE"]));
// app.use(function (request, response, next) {
//   response.locals.messages = request.flash();
//   next();
// });
// app.use(passport.initialize());
// app.use(passport.session());

// //Passport setup
// passport.use(
//   new LocalStrategy(
//     {
//       usernameField: "email",
//       passwordField: "password",
//     },
//     async function (username, password, done) {
//       User.findOne({ where: { email: username } })
//         .then(async (user) => {
//           if (user === null) {
//             return done(null, false, { message: "user does not exist" });
//           }
//           const result = await bcrypt.compare(password, user.password);
//           if (result) return done(null, user);
//           else done(null, false, { message: "Invalid password" });
//         })
//         .catch((err) => err);
//     }
//   )
// );

// passport.serializeUser((user, done) => {
//   console.log("Serialize user in session:", user.id);
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   await User.findByPk(id)
//     .then((user) => {
//       done(null, user);
//     })
//     .catch((err) => {
//       done(err, null);
//     });
// });

// app.get("/", async (req, res) => {
//   if (req.isAuthenticated()) {
//     res.redirect("/dashboard");
//   } else {
//     res.render("index", { csrfToken: req.csrfToken() });
//   }
// });

// app.get("/login", async (req, res) => {
//   return res.render("login", { csrfToken: req.csrfToken() });
// });

// app.get("/signup", async (req, res) => {
//   return res.render("signup", { csrfToken: req.csrfToken() });
// });

// app.post("/users", async (req, res) => {
//   const hashPwd = await bcrypt.hash(req.body.password, saltRounds);
//   try {
//     if (req.body.password === "") {
//       throw new Error("Validation notEmpty on password failed");
//     }
//     console.log("Creating user: ", req.body);
//     let user = await User.create({
//       firstName: req.body.firstName,
//       lastName: req.body.lastName,
//       email: req.body.email,
//       userType: req.body.userType,
//       password: hashPwd,
//     });
//     console.log("User created:", user.dataValues);
//     req.login(user, (err) => {
//       if (err) {
//         console.log(err);
//       }
//       res.status(301).redirect("/dashboard");
//     });
//   } catch (error) {
//     console.log(error.errors[0].message);
//     res.status(401).json({ message: error.errors[0].message });
//   }
// });

// app.post(
//   "/login",
//   passport.authenticate("local", {
//     failureRedirect: "/login",
//     failureFlash: true,
//   }),
//   async (req, res) => {
//     res.redirect("/dashboard");
//   }
// );

// app.get("/dashboard", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
//   if (req.isAuthenticated()) {
//     const myCourses = (await Course.findAll({ include: User })).map(
//       (course) => ({
//         name: course.dataValues.name,
//         author: `${course.User.firstName} ${course.User.lastName}`,
//         strength: 100,
//         id: course.id,
//       })
//     );
//     console.log(myCourses);
//     res.render("dashboard", {
//       firstName: req.user.firstName,
//       userType: req.user.userType,
//       lastName: req.user.lastName,
//       myCourses,
//     });
//   }
// });

// app.get("/signout", (req, res, next) => {
//   req.logout((err) => {
//     if (err) {
//       return next(err);
//     }
//     res.redirect("/");
//   });
// });

// app.get(
//   "/courses/new",
//   connectEnsureLogin.ensureLoggedIn(),
//   async (req, res) => {
//     if (req.user.userType !== "educator") {
//       res.send(
//         `<h3 class="text-center">Sign in as an educator to create courses<br /><a href="/login">Click to login</a></h3>`
//       );
//     }
//     res.render("courses/createCourse", { csrfToken: req.csrfToken() });
//   }
// );

// app.post("/course", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
//   const { courseName } = req.body;
//   const newCourse = await Course.create({
//     name: courseName,
//     userId: req.user.id,
//   });
//   res.redirect("/dashboard/");
// });

// app.get("/courses/:id", async (req, res) => {
//   const courseID = req.params.id;
//   const course = await Course.findByPk(courseID);
//   if (!req.user) {
//     return res.render("courses/coursePage", {
//       courseID,
//       name: course.name,
//       courseOwner: false,
//     });
//   }
//   res.render("courses/coursePage", {
//     courseID,
//     name: course.name,
//     courseOwner: req.user.id === courseID,
//   });
// });

// app.get(
//   "/courses/:id/chapters/new",
//   connectEnsureLogin.ensureLoggedIn(),
//   async (req, res) => {
//     res.json(req.params.id);
//   }
// );

// module.exports = app;

const express = require("express");
const app = express();
const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const path = require("path");
const appRoutes = require("./routes/appRoutes");
const authRoutes = require("./routes/authRoutes");
const { User } = require("./models");

// Middlewares
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(cookieParser("n*_h!bR?tr1t095a*l&1Tr0d7QAsPlcI"));
app.use(flash());
app.use(
  session({
    secret: "3!i9O1Ithi_uxl$$uB2uSt32aMa*0Ige",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(csurf("trofrUzA?rUzu2rLP4Lv&pif$lXepHAv", ["POST", "PUT", "DELETE"]));
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

// Passport setup
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async function (username, password, done) {
      console.log("LSAF");
      const user = await User.findOne({ where: { email: username } });
      if (user === null)
        return done(null, false, { message: "User does not exist" });
      const result = await bcrypt.compare(password, user.password);
      if (result) return done(null, user);
      else done(null, false, { message: "Invalid password" });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serialize user in session:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("DeSerialize user:", id);
  await User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use(appRoutes);
app.use(authRoutes);

module.exports = app;
