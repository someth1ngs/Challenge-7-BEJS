const express = require("express");
const router = express.Router();
const auth = require("../../controllers/auth.controllers");
const { JWT_SECRET } = process.env;
const jwt = require("jsonwebtoken");

let restrict = (req, res, next) => {
  let { authorization } = req.headers;
  if (authorization && authorization.split(" ")[1]) {
    token = authorization.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  } else {
    res.status(401).json({
      status: false,
      message: "token not provided",
      data: null,
    });
  }

  // let token = authorization.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(401).json({
        status: false,
        message: err.message,
        data: null,
      });
    }
    delete user.iat;
    req.user = user;
    next();
  });
};

router.get("/register", async (req, res, next) => {
  try {
    res.render("register.ejs");
  } catch (error) {
    next(error);
  }
});

router.get("/login", async (req, res, next) => {
  try {
    res.render("login.ejs");
  } catch (error) {
    next(error);
  }
});

router.get("/forget-password", async (req, res, next) => {
  try {
    res.render("forgetPassword.ejs");
  } catch (error) {
    next(error);
  }
});

router.get("/send-email", restrict, async (req, res, next) => {
  try {
    res.render("sendEmail.ejs");
  } catch (error) {
    next(error);
  }
});

router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/whoami", restrict, auth.whoami);

router.post("/forget-password", auth.forgetPassword);
// router.post("/reset-password", auth.resetPassword)
router.get("/reset-password", (req, res) => {
  let { token } = req.query;
  res.render("resetPassword", { token : token });
});
router.post("/reset-password", auth.resetPassword);

router.get("/users", auth.index);

module.exports = router;
