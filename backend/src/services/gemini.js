const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

const validSentiments = ["positive", "negative", "neutral"];
const validCategories = ["feature", "UX", "performance", "bug", "other"];

const PROMPT_TEMPLATE = `You are a strict JSON API.
Analyze this product feedback and return only valid JSON with keys:
- sentiment: one of positive|negative|neutral
- category: one of feature|UX|performance|bug|other
- action_summary: one concise sentence describing a recommended action

Do not include markdown fences or extra text.
Feedback: "{{feedback}}"`;

function safeParseJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }
    throw new Error("Gemini did not return parseable JSON");
  }
}

function validateResult(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Gemini result is not an object");
  }

  const sentiment = String(data.sentiment || "").toLowerCase();
  const category = String(data.category || "");
  const actionSummary = data.action_summary;

  if (!validSentiments.includes(sentiment)) {
    throw new Error("Invalid sentiment");
  }

  if (!validCategories.includes(category)) {
    throw new Error("Invalid category");
  }

  if (typeof actionSummary !== "string" || !actionSummary.trim()) {
    throw new Error("Invalid action_summary");
  }

  return {
    sentiment,
    category,
    action_summary: actionSummary.trim(),
  };
}

async function enrichFeedback(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = PROMPT_TEMPLATE.replace("{{feedback}}", text.replace(/"/g, "\\\""));
  const result = await model.generateContent(prompt);
  const content = result.response.text();
  let parsed;

  try {
    parsed = safeParseJson(content);
  } catch (error) {
    logger.warn("Gemini returned non-JSON content", {
      preview: String(content).slice(0, 200),
      reason: error.message,
    });
    throw error;
  }

  return validateResult(parsed);
}

module.exports = {
  enrichFeedback,
  PROMPT_TEMPLATE,
  validCategories,
};
