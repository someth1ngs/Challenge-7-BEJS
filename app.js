require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const PORT = process.env.PORT || 3000;
const Sentry = require("./libs/sentry");
const router = require("./routes/v1");
const app = express();
const path = require("path");
const server = require('http').createServer(app);
global.io = require("socket.io")(server);

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", router);

global.io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
      console.log('user disconnected');
  });
});

app.get("/", (req, res) => {
  const baseUrl = req.baseUrl;
  res.redirect(`${baseUrl}api/v1/login`);
});

app.get("/notifications/:id", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
    });
    res.render("notification.ejs", { userID: userId, notifications: notifications });
  } catch (error) {
    next(error);
  }
});

app.post("/api/v1/notifications", async (req, res, next) => {
  try {
    const { userId, title, message, createdDate } = req.body;
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        createdDate,
        user: { connect: { id: userId } },
      },
    });

    global.io.emit('notification', notification);

    res.status(201).json({
      status: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

// Sentry Check
app.get("/sentry-check", (req, res) =>
  res.json({
    status: true,
    message: "Coba cek di Sentry",
    // data: test,
  })
);

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// 500 error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    status: false,
    message: err.message,
    data: null,
  });
});

// 404 error handler
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: `are you lost? ${req.method} ${req.url} is not registered!`,
    data: null,
  });
});

server.listen(PORT, () => console.log("Listening on port", PORT));