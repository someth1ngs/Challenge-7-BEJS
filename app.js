require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const PORT = process.env.PORT || 3000;
const Sentry = require("./libs/sentry");
const router = require("./routes/v1");
const app = express();
const path = require("path");

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

app.get("/", (req, res) => {
  const baseUrl = req.baseUrl;
  res.redirect(`${baseUrl}api/v1/login`);
})

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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
