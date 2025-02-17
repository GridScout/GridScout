import winston from "winston";
import chalk from "chalk";
import { config } from "@/config";

const debugEnabled = config.DOPPLER_ENVIRONMENT === "dev";

const levelColors: { [key: string]: (msg: string) => string } = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.green,
  debug: chalk.blue,
};

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  const colorizer = levelColors[level] || ((msg: string) => msg);
  return `${chalk.gray(timestamp)} [${colorizer(level.toUpperCase())}]: ${message}`;
});

const logger = winston.createLogger({
  level: debugEnabled ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat,
  ),
  transports: [new winston.transports.Console()],
});

export class Logger {
  static debug(message: string) {
    logger.debug(message);
  }

  static info(message: string) {
    logger.info(message);
  }

  static warn(message: string) {
    logger.warn(message);
  }

  static error(message: string | object, err?: unknown) {
    if (typeof message === "object") {
      logger.error(JSON.stringify(message, null, 2));
    } else {
      let msg = message;
      if (err) {
        msg += "\n" + JSON.stringify(err, null, 2);
      }
      logger.error(msg);
    }
  }
}
