import { HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CError } from '../../kernel/errors/c-error';

export interface ParsedError {
  status: number;
  message: string;
}

export interface ErrorParserOptions {
  i18n?: I18nService;
  lang?: string;
}

export class ErrorParser {
  static parse(
    exception: unknown,
    options: ErrorParserOptions = {},
  ): ParsedError {
    const { i18n, lang } = options;

    if (exception instanceof CError) {
      return this.parseGException(exception, i18n, lang);
    }

    return this.parseGenericException(exception);
  }

  private static parseGException(
    exception: any,
    i18n?: I18nService,
    lang?: string,
  ): ParsedError {
    const error = exception.getError();
    const status = error?.statusCode || HttpStatus.BAD_REQUEST;
    const customMessage = error?.message;
    const i18nCode = error?.code || customMessage;
    const i18nArgs = error?.i18nArgs || {};

    let message: string;

    if (error?.isI18n && i18nCode && i18n) {
      try {
        message = i18n.t(i18nCode, {
          lang,
          ...(i18nArgs && { args: i18nArgs }),
        });
      } catch {
        message = customMessage || 'internal server error';
      }
    } else {
      message = customMessage || 'internal server error';
    }

    return {
      status,
      message,
    };
  }

  private static parseGenericException(exception: unknown): ParsedError {
    if (exception == null) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'internal server error',
      };
    }

    if (this.isNestJsException(exception)) {
      const ex = exception as any;
      const status = ex.getStatus();
      const response = ex.getResponse();

      let message: string;
      if (typeof response === 'string') {
        message = response;
      } else {
        const rawMessage = response?.message;
        message = this.normalizeMessage(rawMessage) || 'internal server error';
      }

      return {
        status,
        message,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'internal server error',
    };
  }

  private static normalizeMessage(message: unknown): string | null {
    if (!message) {
      return null;
    }

    if (Array.isArray(message)) {
      return message
        .filter((msg) => msg != null && msg !== '')
        .map((msg) => String(msg).trim())
        .join('; ');
    }

    if (typeof message === 'object') {
      const obj = message as any;
      if (obj.message) {
        return this.normalizeMessage(obj?.message);
      }
    }

    return String(message);
  }

  private static isNestJsException(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      typeof (exception as any).getStatus === 'function' &&
      typeof (exception as any).getResponse === 'function'
    );
  }
}
