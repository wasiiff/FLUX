type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const minLevel: Level = (process.env.LOG_LEVEL as Level) ?? "info";

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (order[level] < order[minLevel]) return;
  const entry = {
    t: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => emit("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => emit("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit("error", m, meta),

  child(bindings: Record<string, unknown>) {
    return {
      debug: (m: string, meta?: Record<string, unknown>) => emit("debug", m, { ...bindings, ...meta }),
      info: (m: string, meta?: Record<string, unknown>) => emit("info", m, { ...bindings, ...meta }),
      warn: (m: string, meta?: Record<string, unknown>) => emit("warn", m, { ...bindings, ...meta }),
      error: (m: string, meta?: Record<string, unknown>) => emit("error", m, { ...bindings, ...meta }),
    };
  },
};
