type LogMeta = Record<string, unknown>

function write(
  level: "info" | "warn" | "error",
  message: string,
  errorOrMeta?: unknown,
  meta?: LogMeta,
) {
  if (errorOrMeta === undefined && meta === undefined) {
    console[level](message)
    return
  }

  if (meta === undefined) {
    console[level](message, errorOrMeta)
    return
  }

  console[level](message, errorOrMeta, meta)
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    write("info", message, meta)
  },
  warn(message: string, errorOrMeta?: unknown, meta?: LogMeta) {
    write("warn", message, errorOrMeta, meta)
  },
  error(message: string, errorOrMeta?: unknown, meta?: LogMeta) {
    write("error", message, errorOrMeta, meta)
  },
}
