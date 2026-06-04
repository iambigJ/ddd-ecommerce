import { HttpStatus } from '@nestjs/common';

export interface AcornExceptionOptions {
  message?: string;
  code?: string;
  args?: Record<string, any>;
  status?: number;
  isI18n?: boolean;
}

export class CError extends Error {
  private readonly code?: string;
  private readonly args?: Record<string, any>;
  private readonly status: number;
  private readonly isI18n: boolean;

  constructor({
    message,
    code,
    args,
    status = HttpStatus.BAD_REQUEST,
    isI18n = true,
  }: AcornExceptionOptions) {
    super(message);
    this.message = message ?? '';
    this.code = code;
    this.args = args;
    this.status = status ?? HttpStatus.BAD_REQUEST;
    this.isI18n = isI18n;
  }

  getError(): {
    statusCode: number;
    message?: string;
    code?: string;
    i18nArgs?: Record<string, any>;
    isI18n: boolean;
  } {
    return {
      statusCode: this.status,
      message: this.message || undefined,
      code: this.code,
      i18nArgs: this.args,
      isI18n: this.isI18n,
    };
  }
}
