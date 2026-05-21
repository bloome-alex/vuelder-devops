import * as fs from 'fs';
import * as path from 'path';

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  orange: '\x1b[38;5;208m',
};

const config = {
  level: process.env.LOGGER_LEVEL || 'info',
  localSave: process.env.LOGGER_LOCAL_SAVE === 'true',
  logsPath: process.env.LOGGER_LOGS_PATH || './logs',
};

class LogChain {
  private timestamp: string;
  private level: LogLevel;
  private message: string;
  private args: any[];
  private showDebug: boolean;

  constructor(level: LogLevel, message: string, ...args: any[]) {
    this.timestamp = LogChain.getTimestamp();
    this.level = level;
    this.message = message;
    this.args = args;
    this.showDebug = config.level === 'debug';
    this.autoWrite();
  }

  debug(): void {
    this.showDebug = true;
    this.write();
  }

  private colorize(text: string): string {
    switch (this.level) {
      case LogLevel.INFO:
        return `${colors.blue}${text}${colors.reset}`;
      case LogLevel.WARN:
        return `${colors.orange}${text}${colors.reset}`;
      case LogLevel.ERROR:
        return `${colors.red}${text}${colors.reset}`;
    }
  }

  private static getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private formatMessage(): string {
    const levelTag = this.colorize(`[${this.level}]`);
    let formatted = `${this.timestamp} ${levelTag} ${this.message}`;

    if (this.args.length > 0) {
      formatted += ' ' + this.args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
    }

    if (this.showDebug) {
      const stack = new Error().stack?.split('\n').slice(3).join('\n') || '';
      formatted += `\n${stack}`;
    }

    return formatted;
  }

  private autoWrite(): void {
    this.write();
  }

  private write(): void {
    const formatted = this.formatMessage();
    this.writeToConsole(formatted);

    if (config.localSave) {
      this.saveToFile(formatted);
    }
  }

  private writeToConsole(message: string): void {
    switch (this.level) {
      case LogLevel.INFO:
        console.info(message);
        return;
      case LogLevel.WARN:
        console.warn(message);
        return;
      case LogLevel.ERROR:
        console.error(message);
        return;
    }
  }

  private saveToFile(message: string): void {
    try {
      if (!fs.existsSync(config.logsPath)) {
        fs.mkdirSync(config.logsPath, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      const fileName = `app-${date}.log`;
      const filePath = path.join(config.logsPath, fileName);

      fs.appendFileSync(filePath, message + '\n');
    } catch {
      console.error('Failed to write log to file');
    }
  }
}

export class Logger {
  static info(message: string, ...args: any[]): LogChain {
    return new LogChain(LogLevel.INFO, message, ...args);
  }

  static error(message: string, ...args: any[]): LogChain {
    return new LogChain(LogLevel.ERROR, message, ...args);
  }

  static warning(message: string, ...args: any[]): LogChain {
    return new LogChain(LogLevel.WARN, message, ...args);
  }
}
