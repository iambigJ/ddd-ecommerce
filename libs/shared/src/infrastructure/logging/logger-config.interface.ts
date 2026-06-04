export interface LoggerConfig {
  appName: string;
  environment?: string;
  logLevel?: string;
  logDir?: string;
  maxFileSize?: string;
  maxFiles?: string;
  enableConsole?: boolean;
  exceptionFilePath?: string;
}
