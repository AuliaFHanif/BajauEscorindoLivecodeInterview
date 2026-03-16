const express = require("express");
const Feedback = require("../models/Feedback");
const { enrichFeedback } = require("../services/gemini");
const HttpError = require("../utils/httpError");
const logger = require("../utils/logger");

const router = express.Router();
const validStatuses = ["open", "in-progress", "resolved"];

router.post("/", async (req, res, next) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text || text.length > 2000) {
      throw new HttpError(400, "text is required and must be <= 2000 chars");
    }

    const feedback = await Feedback.create({ text });

    try {
      const aiFields = await enrichFeedback(text);
      await feedback.update(aiFields);
    } catch (error) {
      logger.warn("Gemini enrichment unavailable", {
        requestId: req.requestId,
        feedbackId: feedback.id,
        reason: error.message,
      });
    }

    const fresh = await Feedback.findByPk(feedback.id);
    return res.status(201).json(fresh);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const items = await Feedback.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || "").trim();

    if (!validStatuses.includes(status)) {
      throw new HttpError(400, "status must be open|in-progress|resolved");
    }

    const item = await Feedback.findByPk(id);
    if (!item) {
      throw new HttpError(404, "Feedback not found", { id });
    }

    await item.update({ status });
    return res.json(item);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Feedback.findByPk(id);

    if (!item) {
      throw new HttpError(404, "Feedback not found", { id });
    }

    await item.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
