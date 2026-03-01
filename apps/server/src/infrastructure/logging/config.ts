import type { LoggerOptions } from "pino";

export const pinoConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",

  redact: {
    paths: ["req.headers.authorization", "password", "token"],
    remove: true,
  },

  formatters: {
    level(label) {
      return { level: label };
    },
  },

  timestamp: true,

  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  },
};
