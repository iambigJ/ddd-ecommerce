import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { Redis } from 'ioredis';
import { CError, generateStableHash } from '@ddd-ecommerce/shared';

interface RequestWithBody {
  method: string;
  route?: { path?: string };
  originalUrl?: string;
  body: unknown;
  currentUser?: { id: string };
}

@Injectable()
export class OrderIdempotencyInterceptor implements NestInterceptor {
  private readonly ttlSeconds = 60 * 10;

  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithBody>();
    const customerId = request.currentUser?.id ?? 'anonymous';
    const key = this.buildKey(request, customerId);

    return from(this.redis.get(key)).pipe(
      switchMap((existingPayload) => {
        if (existingPayload) {
          const parsed = JSON.parse(existingPayload) as {
            status: 'processing' | 'completed';
            response?: unknown;
          };

          if (parsed.status === 'processing') {
            throw new CError({
              status: HttpStatus.CONFLICT,
              message: 'orders.idempotencyInProgress',
            });
          }

          return of(parsed.response);
        }

        return from(
          this.redis.set(
            key,
            JSON.stringify({ status: 'processing' }),
            'EX',
            this.ttlSeconds,
            'NX',
          ),
        ).pipe(
          switchMap((result) => {
            if (result !== 'OK') {
              throw new CError({
                status: HttpStatus.CONFLICT,
                message: 'orders.idempotencyInProgress',
              });
            }

            return next.handle().pipe(
              tap((response) => {
                void this.redis.set(
                  key,
                  JSON.stringify({ status: 'completed', response }),
                  'EX',
                  this.ttlSeconds,
                );
              }),
            );
          }),
        );
      }),
    );
  }

  private buildKey(request: RequestWithBody, customerId: string): string {
    const hash = generateStableHash({
      customerId,
      method: request.method,
      route: request.route?.path ?? request.originalUrl,
      body: request.body,
    });

    return `idempotency:orders:create:${hash}`;
  }
}
