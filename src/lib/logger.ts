export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  correlationId?: string;
  organizationId?: string;
  userId?: string;
  action?: string;
  durationMs?: number;
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown) {
    const timestamp = new Date().toISOString();
    const entry: Record<string, any> = {
      timestamp,
      level,
      message,
      ...(context || {}),
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        entry.error = error;
      }
    }

    return JSON.stringify(entry);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext, error?: Error | unknown) {
    console.warn(this.formatLog('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error | unknown) {
    console.error(this.formatLog('error', message, context, error));
  }

  fatal(message: string, context?: LogContext, error?: Error | unknown) {
    console.error(this.formatLog('fatal', message, context, error));
  }
}

export const logger = new Logger();
