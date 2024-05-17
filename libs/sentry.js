const Sentry = require("@sentry/node");
const express = require("express"); // Improt express
const app = express();

const { SENTRY_DSN, ENV } = process.env;

Sentry.init({
  environment: ENV,
  dsn: SENTRY_DSN,
  integrations: [
   // enable HTTP calls tracing
   new Sentry.Integrations.Http({ tracing: true }),
   // enable Express.js middleware tracing
   new Sentry.Integrations.Express({ app })
  ],
  tracesSampleRate: 1.0
});

module.exports = Sentry