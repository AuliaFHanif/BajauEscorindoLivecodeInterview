require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const sequelize = require("./config/db");
require("./models/Feedback");
const feedbackRoutes = require("./routes/feedback");
const logger = require("./utils/logger");
const HttpError = require("./utils/httpError");

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.requestId = randomUUID();
  req.startedAtMs = Date.now();
  res.setHeader("x-request-id", req.requestId);
  next();
});

app.use((req, res, next) => {
  res.on("finish", () => {
    logger.info("Request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - req.startedAtMs,
      ip: req.ip,
    });
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/feedback", feedbackRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((error, req, res, _next) => {
  const isJsonParseError = error?.type === "entity.parse.failed";
  const statusCode = error instanceof HttpError ? error.statusCode : isJsonParseError ? 400 : 500;
  const message = error instanceof HttpError
    ? error.message
    : isJsonParseError
      ? "Malformed JSON body"
      : "Internal server error";

  logger.error("Request failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error,
    details: error.details,
  });

  res.status(statusCode).json({
    error: message,
    requestId: req.requestId,
    details: error instanceof HttpError ? error.details : undefined,
  });
});

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(port, () => {
      logger.info("API listening", { port, url: `http://localhost:${port}` });
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

start();
