function nowIso() {
  return new Date().toISOString();
}

function toSerializable(value, depth = 0) {
  if (depth > 3) {
    return "[max-depth]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const next = {};
    for (const key of Object.keys(value)) {
      next[key] = toSerializable(value[key], depth + 1);
    }
    return next;
  }

  return value;
}

function log(level, message, context = {}) {
  const payload = {
    ts: nowIso(),
    level,
    message,
    ...toSerializable(context),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info: (message, context) => log("info", message, context),
  warn: (message, context) => log("warn", message, context),
  error: (message, context) => log("error", message, context),
};
