/**
 * Centralized logging utility for ProofAI
 * Provides consistent logging across the application with proper levels and formatting
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  component?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  public error(message: string, error?: Error | any, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

    const fullContext = { ...context, error: errorDetails };
    
    console.error(this.formatMessage('ERROR', message, fullContext));
  }

  public warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage('WARN', message, context));
  }

  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage('INFO', message, context));
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(this.formatMessage('DEBUG', message, context));
  }

  // Specialized methods for common use cases
  public apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, { ...context, type: 'api_request' });
  }

  public apiResponse(method: string, path: string, status: number, duration?: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API ${method} ${path} - ${status}`;
    const fullContext = { ...context, type: 'api_response', status, duration };

    if (level === LogLevel.ERROR) {
      this.error(message, undefined, fullContext);
    } else {
      this.info(message, fullContext);
    }
  }

  public transcription(message: string, context?: LogContext): void {
    this.info(`[TRANSCRIPTION] ${message}`, { ...context, service: 'transcription' });
  }

  public pdf(message: string, context?: LogContext): void {
    this.info(`[PDF] ${message}`, { ...context, service: 'pdf' });
  }

  public auth(message: string, context?: LogContext): void {
    this.info(`[AUTH] ${message}`, { ...context, service: 'auth' });
  }

  public database(message: string, context?: LogContext): void {
    this.info(`[DATABASE] ${message}`, { ...context, service: 'database' });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for common patterns
export const logError = (message: string, error?: Error | any, context?: LogContext) => 
  logger.error(message, error, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);
