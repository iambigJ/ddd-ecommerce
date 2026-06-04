// src/common/interceptors/logger.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const now = Date.now();

    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const ip = req.ip;

    this.logger.log(`[Incoming] ${method} ${url} - IP: ${ip}`);

    return next.handle().pipe(
      tap((_) => {
        const ms = Date.now() - now;
        this.logger.log(`[Outgoing] ${method} ${url} - ${ms}ms - IP: ${ip}`);
      }),
    );
  }
}
