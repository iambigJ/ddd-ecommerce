import { Injectable, Inject, LoggerService, Scope } from '@nestjs/common';
import { WinstonLogger } from 'nest-winston';

@Injectable({ scope: Scope.TRANSIENT })
export class CLogger implements LoggerService {
  private context = 'Application';

  constructor(
    @Inject('WINSTON_LOGGER') private readonly logger: WinstonLogger,
  ) {}

  setContext(context: string) {
    this.context = context;
  }

  log(message: string): void;
  log(message: string, context: string): void;
  log(message: string, metadata: Record<string, any>): void;
  log(message: string, contextOrMetadata?: Record<string, any> | string) {
    const isContextString = typeof contextOrMetadata === 'string';

    const isMetadataObject =
      contextOrMetadata && typeof contextOrMetadata === 'object';

    const context = isContextString
      ? contextOrMetadata
      : (contextOrMetadata?.metadata as string) || this.context;

    const extraMetadata = isMetadataObject ? contextOrMetadata : {};

    this.logger.log({
      message,
      context,
      ...extraMetadata,
    });
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.logger.warn({
      message,
      context: this.context,
      ...metadata,
    });
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.logger.debug?.({
      message,
      context: this.context,
      ...metadata,
    });
  }

  verbose(message: string, metadata?: Record<string, any>) {
    this.logger.verbose?.({
      message,
      context: this.context,
      ...metadata,
    });
  }

  error(message: string, metadata?: Record<string, any>) {
    this.logger.error({
      context: this.context,
      message,
      ...metadata,
    });
  }

  logSecurity(message: string, details: any) {
    this.logger.warn({
      context: 'Security',
      message,
      ...details,
    });
  }

  logAudit(message: string, details: any) {
    this.logger.log({
      context: 'Audit',
      message,
      ...details,
    });
  }
}
