import axios from "axios";
import { logger } from "../utils/logger";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

function toApiErrorContext(error) {
  return {
    request: {
      method: error.config?.method,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.config?.data,
    },
    response: {
      status: error.response?.status,
      data: error.response?.data,
    },
    code: error.code,
    message: error.message,
    error,
  };
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error("API request failed", toApiErrorContext(error));
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallback = "Unexpected error") {
  const serverError = error?.response?.data?.error;
  if (typeof serverError === "string" && serverError.trim()) {
    return serverError;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export async function listFeedback() {
  const { data } = await client.get("/feedback");
  return data;
}

export async function createFeedback(text) {
  const { data } = await client.post("/feedback", { text });
  return data;
}

export async function updateFeedbackStatus(id, status) {
  const { data } = await client.patch(`/feedback/${id}`, { status });
  return data;
}

export async function deleteFeedback(id) {
  await client.delete(`/feedback/${id}`);
}
