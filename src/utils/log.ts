/**
 * Logging Utility Module
 * Handles application logging
 */

import fs from 'fs-extra';
import path from 'path';
import { getPaths } from './paths.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logFile: string | null = null;
  private stream: fs.WriteStream | null = null;

  constructor() {
    this.initLogFile();
  }

  private async initLogFile() {
    try {
      const paths = getPaths();
      await fs.ensureDir(paths.logs);

      const timestamp = new Date().toISOString().split('T')[0];
      this.logFile = path.join(paths.logs, `launcher-${timestamp}.log`);

      this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
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

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  close() {
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
