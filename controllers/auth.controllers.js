const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = process.env;
const { getHTML, sendMail } = require("../libs/nodemailer");

module.exports = {
  register: async (req, res, next) => {
    try {
      let { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "name, email and password are required!",
          data: null,
        });
      }

      let exist = await prisma.user.findFirst({ where: { email } });
      if (exist) {
        return res.status(400).json({
          status: false,
          message: "email has already been used!",
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      let userData = {
        name,
        email,
        password: encryptedPassword,
      };
      let user = await prisma.user.create({ data: userData });
      delete user.password;

      return res.status(201).json({
        status: true,
        message: "OK",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "email and password are required!",
          data: null,
        });
      }

      let user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "invalid email or password!",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: "invalid email or password!",
          data: null,
        });
      }

      delete user.password;
      let token = jwt.sign(user, JWT_SECRET);

      if (req.headers["content-type"] === "application/json") {
        return res.json({
          status: true,
          message: "Login successful",
          data: { ...user, token },
        });
      }
      res.redirect(302, `/api/v1/send-email?token=${token}`);
    } catch (error) {
      next(error);
    }
  },

  whoami: async (req, res, next) => {
    try {
      res.json({
        status: true,
        message: "OK",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      let { search } = req.query;

      let users = await prisma.user.findMany({
        where: { name: { contains: search } },
        orderBy: { id: "asc" },
      });

      if (users.length === 0) {
        res.status(400).json({
          status: false,
          message: `Users dengan nama ${search} tidak ada!`,
        });
      }

      users.forEach((user) => {
        delete user.password;
      });

      res.status(200).json({
        status: true,
        message: "Berhasil mengambil data Users",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  forgetPassword: async (req, res, next) => {
    try {
      const email = req.body.email;
      const findUser = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!findUser) {
        return res.status(404).json({
          status: false,
          message: "user not found",
          data: null,
        });
      }

      const token = jwt.sign({ email: findUser.email }, JWT_SECRET);
      const html = await getHTML("urlResetPassword.ejs", {
        name: findUser.name,
        reset_password_url: `${req.protocol}://${req.get(
          "host"
        )}/api/v1/reset-password?token=${token}`,
      });
      await sendMail(email, "Email Forget Password", html);
      return res.status(200).json({
        status: true,
        message: "Success Send Email Forget Password",
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { token } = req.query;
      const { password } = req.body;
      console.log(token);
      if (!password) {
        return res.status(400).json({
          status: false,
          message: "Password Required!",
          data: null,
        });
      }
      let encryptedPassword = await bcrypt.hash(password, 10);

      jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            status: false,
            message: "Invalid or expired token!",
            data: null,
          });
        }
  
        const updateUser = await prisma.user.update({
          where: { email: decoded.email },
          data: { password: encryptedPassword },
          select: { id: true, name: true, email: true } 
        });
  
        res.status(200).json({
          status: true,
          message: "Your password has been updated successfully!",
          data: updateUser,
        });
      });
    } catch (error) {
      next(error)
    }
  },
};
