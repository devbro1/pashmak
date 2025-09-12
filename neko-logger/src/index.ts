import pino, { LoggerOptions } from 'pino';

export type MapObject = Record<string, object | string | number | boolean | undefined>;
export type LogLevel = 'info' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogMessage = MapObject & { msg: string };
export class Logger {
  private logger;
  private extraFunc: ((message: LogMessage) => LogMessage) | undefined;

  constructor(
    options: LoggerOptions<never, boolean> & {
      extrasFunction?: (message: LogMessage) => LogMessage;
      stream?: pino.DestinationStream;
    } = {}
  ) {
    this.logger = pino(
      {
        formatters: {
          level(label, number) {
            return { level: label }; // use label (e.g., 'info', 'error') or number (e.g., 30, 50)
          },
        },
        ...options,
      },
      options?.stream || undefined
    );

    if (options.extrasFunction) {
      this.extraFunc = options.extrasFunction;
    }
  }

  setExtrasFunction(func: typeof this.extraFunc) {
    this.extraFunc = func;
  }

  logMessage(level: LogLevel, message: string | LogMessage, details: object = {}) {
    let finalMessage: LogMessage;

    if (typeof message === 'string') {
      finalMessage = { msg: message };
    } else {
      finalMessage = message;
    }
    finalMessage = { ...finalMessage, ...details };

    if (this.extraFunc) {
      finalMessage = this.extraFunc(finalMessage);
    }
    this.logger[level](finalMessage);
  }

  trace(message: string | LogMessage, details: object = {}) {
    this.logMessage('trace', message, details);
  }

  debug(message: string | LogMessage, details: object = {}) {
    this.logMessage('debug', message, details);
  }

  info(message: string | LogMessage, details: object = {}) {
    this.logMessage('info', message, details);
  }

  warn(message: string | LogMessage, details: object = {}) {
    this.logMessage('warn', message, details);
  }

  error(message: string | LogMessage, details: object = {}) {
    this.logMessage('error', message, details);
  }

  fatal(message: string | LogMessage, details: object = {}) {
    this.logMessage('fatal', message, details);
  }
}
