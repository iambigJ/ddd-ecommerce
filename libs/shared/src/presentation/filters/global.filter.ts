import { ArgumentsHost, Catch, Injectable } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { type Request, type Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { CLogger } from '../../infrastructure/logging/logger.service';
import { ErrorParser } from './error-parser.helper';

interface ProblemDetails {
  type: string;
  status: number;
  details: string;
  timestamp: string;
  method: string;
  instance: string;
  stack?: string;
}

@Injectable()
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    private readonly adapter: HttpAdapterHost,
    private readonly logger: CLogger,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() === 'http') {
      return this.handleHttp(exception, host);
    }

    this.logger.warn?.(
      `Unknown host type "${host.getType()}", defaulting to HTTP`,
    );
    super.catch(exception, host);
  }

  private handleHttp(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // const lang = this.resolveLanguage(req);
    const { status, message } = ErrorParser.parse(exception, {
      i18n: this.i18n,
      lang: this.resolveLanguage(req),
    });
    const instance = req.originalUrl || req.url || req.path || '/';

    const problem: ProblemDetails = {
      type: req.originalUrl || req.url,
      status,
      details: message,
      timestamp: new Date().toISOString(),
      method: req.method,
      instance,
    };

    this.logger.error('HTTP Exception', {
      ...problem,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      stack: (exception as any)?.stack,
    });

    this.adapter.httpAdapter.reply(res, problem, status);
  }

  private resolveLanguage(req: Request): string | undefined {
    const langFromQuery = req.query?.lang;
    if (typeof langFromQuery === 'string' && langFromQuery.trim()) {
      return langFromQuery.trim();
    }

    const langFromCustomHeader = req.headers['x-lang'];
    if (
      typeof langFromCustomHeader === 'string' &&
      langFromCustomHeader.trim()
    ) {
      return langFromCustomHeader.trim();
    }

    const acceptLanguage = req.headers['accept-language'];
    if (typeof acceptLanguage === 'string' && acceptLanguage.trim()) {
      const primaryLang = acceptLanguage
        .split(',')
        .map((item) => item.split(';')[0]?.trim())
        .find(Boolean);

      if (primaryLang) {
        return primaryLang;
      }
    }

    return undefined;
  }
}
