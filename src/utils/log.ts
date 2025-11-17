/**
 * Logging Utility Module
 * Handles application logging
 */

import fs from 'fs-extra';
import path from 'path';
import { getPaths } from './paths.js';
import { formatISODate } from './date.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logFile: string | null = null;
  private stream: fs.WriteStream | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the log file synchronously (lazy initialization)
   * Called automatically on first log write
   */
  private initLogFile(): void {
    if (this.initialized) {
      return;
    }

    try {
      const paths = getPaths();

      // Synchronous directory creation (safe for constructor/early init)
      fs.ensureDirSync(paths.logs);

      const timestamp = formatISODate(new Date());
      this.logFile = path.join(paths.logs, `launcher-${timestamp}.log`);

      this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize log file:', error);
      // Graceful fallback - logging will continue to console only
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Lazy initialization on first log write
    if (!this.initialized) {
      this.initLogFile();
    }
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (process.env.NODE_ENV !== 'production') {
      switch (level) {
        case 'error':
          console.error(formatted, ...args);
          break;
        case 'warn':
          console.warn(formatted, ...args);
          break;
        case 'debug':
          if (process.env.DEBUG) {
            console.log(formatted, ...args);
          }
          break;
        default:
          console.log(formatted, ...args);
      }
    }

    if (this.stream) {
      const logLine = args.length > 0
        ? `${formatted} ${JSON.stringify(args)}\n`
        : `${formatted}\n`;
      this.stream.write(logLine);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  close(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}

export const logger = new Logger();

process.on('exit', () => {
  logger.close();
});
