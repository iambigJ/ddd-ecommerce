import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import { LoggerConfig } from './logger-config.interface';

export class WinstonConfigFactory {
  private static createDevFormat() {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(
        ({ level, message, timestamp, context, stack, ...meta }) => {
          const colorizer = winston.format.colorize();

          const levelStr = `${colorizer.colorize(level, level.toUpperCase().padEnd(5))}`;
          const contextStr = colorizer.colorize(
            'warn',
            `[${typeof context === 'string' ? context : 'unknown'}]`,
          );

          let messageOutput = '';
          if (message instanceof Error) {
            messageOutput = colorizer.colorize(level, message.message);
            stack = message.stack;
          } else if (typeof message === 'object') {
            try {
              messageOutput = JSON.stringify(message, null, 2);
            } catch (e) {
              messageOutput = String(message);
            }
          } else {
            messageOutput = colorizer.colorize(level, String(message));
          }

          let metaOutput = '';
          if (Object.keys(meta)?.length > 0 && context !== '‌‌BootStrap') {
            try {
              metaOutput = `\n📊 Meta: ${JSON.stringify(meta, null, 2)}`;
            } catch (e) {
              metaOutput = `\n📊 Meta: [Circular/Complex Object]`;
            }
          }

          const stackOutput = stack
            ? `\n🔥 Stack:\n${typeof stack === 'string' ? stack : JSON.stringify(stack)}`
            : '';

          return `${timestamp} ${levelStr} ${contextStr} ${messageOutput}${metaOutput}${stackOutput}`;
        },
      ),
    );
  }

  private static createProdFormat() {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf((info: Record<string, any>) => {
        const logEntry = {
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          context: info.context,
          ...info,
        };

        return JSON.stringify({
          ...logEntry,
        });
      }),
    );
  }

  private static createTransports(config: LoggerConfig): winston.transport[] {
    const transports: winston.transport[] = [];
    const environment =
      config.environment || process.env.NODE_ENV || 'development';

    transports.push(
      new winston.transports.Console({
        format:
          environment === 'production'
            ? this.createProdFormat()
            : this.createDevFormat(),
        level: process.env.logLevel || 'debug',
      }),
    );

    return transports;
  }

  private static createUnhandledTransport(config: LoggerConfig) {
    return new DailyRotateFile({
      dirname:   config.exceptionFilePath ||
      path.join(process.cwd(), 'logs', config.appName, config.logDir || 'logs'),
      filename: `${config.appName}-unhandled-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      level: config.logLevel || 'error',
      maxSize: config.maxFileSize || '10m',
      maxFiles: config.maxFiles || '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf((info: Record<string, any>) => {
          const errorType =
            info.exception === true
              ? 'exception'
              : info.rejection === true
                ? 'rejection'
                : 'error';

          const logEntry = {
            timestamp: info.timestamp,
            level: info.level || 'error',
            type: errorType,
            message: info.message || 'Unknown error',
            stack: info.stack || null,
            context: info.context || 'Global',
            ...(info.exception && { exception: true }),
            ...(info.rejection && { rejection: true }),
          };

          try {
            return JSON.stringify(logEntry);
          } catch (error) {
            return JSON.stringify({
              timestamp: logEntry.timestamp,
              level: logEntry.level,
              type: logEntry.type,
              message:
                'Logger failed to serialize error object (Circular Reference)',
              rawMessage: String(logEntry.message),
              stack: logEntry.stack,
            });
          }
        }),
      ),
    });
  }
  static createLogger(config: LoggerConfig) {
    const logLevel = config.logLevel || 'debug';
    const unhandledTransport = this.createUnhandledTransport(config);
    return WinstonModule.createLogger({
      level: logLevel,
      transports: this.createTransports(config),
      exitOnError: false,
      exceptionHandlers: [unhandledTransport],
      rejectionHandlers: [unhandledTransport],
    });
  }
}
