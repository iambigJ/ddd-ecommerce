import { Global, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import {
  CError,
  CLogger,
  parseExpirationToSeconds,
} from '@ddd-ecommerce/shared';
import { SessionJti } from '../../domain/value-objects/session-jti.value-object';
import { CustomerAuthResult } from './customer-auth.types';
import { CustomerSessionAclPort } from '../../application/ports/customer-session-acl.port';

interface JwtPayload {
  jti: string;
}

@Global()
@Injectable()
export class CustomerAuthService implements CustomerSessionAclPort {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;
  private readonly sessionPrefix: string;
  private readonly customerSessionsPrefix: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: CLogger,
    @Inject('REDIS') private readonly redis: Redis,
  ) {
    this.logger.setContext(CustomerAuthService.name);
    this.accessTokenSecret = this.configService.getOrThrow<string>(
      'jwt.accessToken',
    );
    this.refreshTokenSecret = this.configService.getOrThrow<string>(
      'jwt.refreshToken',
    );
    this.accessTokenExpiration =
      this.configService.get<string>('jwt.accessEx') ?? '24h';
    this.refreshTokenExpiration =
      this.configService.get<string>('jwt.refreshEx') ?? '7d';
    this.accessTokenTtlSeconds = parseExpirationToSeconds(
      this.accessTokenExpiration,
    );
    this.refreshTokenTtlSeconds = parseExpirationToSeconds(
      this.refreshTokenExpiration,
    );
    this.sessionPrefix =
      this.configService.get<string>('redis.sessionPrefix') ?? 'session:';
    this.customerSessionsPrefix =
      this.configService.get<string>('redis.customerSessionsPrefix') ??
      'customer:sessions:';
  }

  async issueTokens(customerId: string): Promise<CustomerAuthResult> {
    const jti = SessionJti.generate().getValue();
    const payload = { jti };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenTtlSeconds,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenTtlSeconds,
    });

    await this.storeSession(customerId, jti);

    return {
      accessToken,
      refreshToken,
      jti,
    };
  }

  async refreshTokens(refreshToken: string): Promise<CustomerAuthResult> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.invalidToken',
      });
    }

    const customerId = await this.resolveCustomerIdByJti(payload.jti);

    if (!customerId) {
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.sessionExpired',
      });
    }

    const issuedTokens = await this.issueTokens(customerId);
    await this.logoutSession(payload.jti);

    return issuedTokens;
  }

  async resolveCustomerIdByJti(jti: string): Promise<string | null> {
    return this.redis.get(this.getSessionKey(jti));
  }

  async logoutSession(jti: string): Promise<void> {
    const sessionKey = this.getSessionKey(jti);
    const customerId = await this.redis.get(sessionKey);

    const pipeline = this.redis.multi().del(sessionKey);
    if (customerId) {
      pipeline.srem(this.getCustomerSessionsKey(customerId), jti);
    }

    await pipeline.exec();
  }

  async logoutEverywhere(customerId: string): Promise<void> {
    const sessionsKey = this.getCustomerSessionsKey(customerId);
    const allJtis = await this.redis.smembers(sessionsKey);

    if (allJtis.length === 0) {
      await this.redis.del(sessionsKey);
      return;
    }

    const pipeline = this.redis.multi();
    for (const jti of allJtis) {
      pipeline.del(this.getSessionKey(jti));
    }
    pipeline.del(sessionsKey);
    await pipeline.exec();
  }

  private async storeSession(customerId: string, jti: string): Promise<void> {
    const sessionKey = this.getSessionKey(jti);
    const sessionsKey = this.getCustomerSessionsKey(customerId);
    const ttl = this.refreshTokenTtlSeconds;

    await this.redis
      .multi()
      .set(sessionKey, customerId, 'EX', ttl)
      .sadd(sessionsKey, jti)
      .expire(sessionsKey, ttl)
      .exec();
  }

  private getSessionKey(jti: string): string {
    return `${this.sessionPrefix}${jti}`;
  }

  private getCustomerSessionsKey(customerId: string): string {
    return `${this.customerSessionsPrefix}${customerId}`;
  }
}
