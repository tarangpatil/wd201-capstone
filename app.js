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
