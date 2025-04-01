import chalk from "chalk";
import winston, { createLogger, format, transports } from "winston";
import env from "@gridscout/env";

const { combine, timestamp, printf } = format;

class Logger {
  private logger: winston.Logger;

  constructor() {
    const customFormat = printf(({ level, message, timestamp }) => {
      let colouredLevel: string;
      switch (level) {
        case "info":
          colouredLevel = chalk.green.bold("INFO");
          break;
        case "warn":
          colouredLevel = chalk.yellow.bold("WARN");
          break;
        case "error":
          colouredLevel = chalk.red.bold("ERROR");
          break;
        case "debug":
          colouredLevel = chalk.blue.bold("DEBUG");
          break;
        default:
          colouredLevel = level.toUpperCase();
      }
      return `${chalk.gray(timestamp)} ${colouredLevel} ${message}`;
    });

    this.logger = createLogger({
      level: env.DOPPLER_ENVIRONMENT === "dev" ? "debug" : "info",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customFormat,
      ),
      transports: [new transports.Console()],
    });
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }

  public error(message: unknown): void {
    this.logger.error(message);
  }

  public debug(message: string): void {
    if (env.DOPPLER_ENVIRONMENT == "dev") {
      this.logger.debug(message);
    }
  }
}

export default new Logger();
