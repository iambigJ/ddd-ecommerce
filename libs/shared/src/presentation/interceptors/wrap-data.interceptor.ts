import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const res = ctx.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((body) => {
        const ct = res.getHeader('content-type');
        if (ct && String(ct).includes('application/problem+json'))
          return body as Record<string, any>;
        let message: any;
        if (
          (body as Record<string, any>)?.message != undefined &&
          (body as Record<string, any>)?.message != null
        ) {
          message = (body as Record<string, unknown>)?.message as string;
          delete (body as Record<string, any>)?.message;
        }
        return {
          data: body as Record<string, any>,
          success: true,
          ...(message ? { message: message as string } : {}),
        };
      }),
    );
  }
}
