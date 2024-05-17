const express = require("express");
const router = express.Router();
const auth = require("../../controllers/auth.controllers");
const { JWT_SECRET } = process.env;
const jwt = require("jsonwebtoken");

let restrict = (req, res, next) => {
  let { authorization } = req.headers;
  if (!authorization || !authorization.split(" ")[1]) {
    res.status(401).json({
      status: false,
      message: "token not provided",
      data: null,
    });
  }

  let token = authorization.split(" ")[1];
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

router.post("/register", auth.register);
router.post("/login", auth.login);

router.get("/whoami", restrict, auth.whoami);
router.get("/verify", auth.verifyEmail);
router.get("/request-verify", restrict, auth.requestVerifyEmail);
// router.get("/reset-password", (req, res) => {
//   let { token } = req.query;
//   console.log(token);
//   res.render("reset-password", { token });
// });

router.get("/users", auth.index)

module.exports = router;
