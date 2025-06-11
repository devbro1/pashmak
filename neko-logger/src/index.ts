import { info } from 'console';
import pino, { LoggerOptions } from 'pino';

export type MapObject = Record<string, object | string | number | undefined>;
export type LogLevel = 'info' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogMessage = MapObject & { msg: string };
export class Logger {
  private logger;
  private extraFunc: ((message: LogMessage) => LogMessage) | undefined;

  constructor(
    options: LoggerOptions<never, boolean> & {
      extrasFunction?: (message: LogMessage) => LogMessage;
    }
  ) {
    this.logger = pino(options);

    if (options.extrasFunction) {
      this.extraFunc = options.extrasFunction;
    }
  }

  setExtrasFunction(func: typeof this.extraFunc) {
    this.extraFunc = func;
  }

  logMessage(level: LogLevel, message: string | LogMessage) {
    let finalMessage: LogMessage;

    if (typeof message === 'string') {
      finalMessage = { msg: message };
    } else {
      finalMessage = message;
    }

    if (this.extraFunc) {
      finalMessage = this.extraFunc(finalMessage);
    }
    this.logger[level](finalMessage);
  }

  trace(message: string | LogMessage) {
    this.logMessage('trace', message);
  }

  debug(message: string | LogMessage) {
    this.logMessage('debug', message);
  }

  info(message: string | LogMessage) {
    this.logMessage('info', message);
  }

  warn(message: string | LogMessage) {
    this.logMessage('warn', message);
  }

  error(message: string | LogMessage) {
    this.logMessage('error', message);
  }

  fatal(message: string | LogMessage) {
    this.logMessage('fatal', message);
  }
}
