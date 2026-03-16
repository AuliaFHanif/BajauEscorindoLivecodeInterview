function timestamp() {
  return new Date().toISOString();
}

function extractError(error) {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function write(level, message, context = {}) {
  const payload = {
    ts: timestamp(),
    level,
    message,
    ...context,
    error: extractError(context.error),
  };

  if (level === "error") {
    console.error("[frontend]", payload);
    return;
  }

  if (level === "warn") {
    console.warn("[frontend]", payload);
    return;
  }

  console.log("[frontend]", payload);
}

export const logger = {
  info(message, context) {
    write("info", message, context);
  },
  warn(message, context) {
    write("warn", message, context);
  },
  error(message, context) {
    write("error", message, context);
  },
};

export function installGlobalErrorLogging() {
  window.addEventListener("error", (event) => {
    logger.error("Unhandled browser error", {
      source: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error || event.message,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      source: "window.unhandledrejection",
      reason: event.reason,
    });
  });
}
