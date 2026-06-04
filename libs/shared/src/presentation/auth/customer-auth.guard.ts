import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CError } from '../../kernel/errors/c-error';

export const CUSTOMER_SESSION_ACL = Symbol.for(
  '@ddd-ecommerce/customers/CUSTOMER_SESSION_ACL',
);


interface CustomerSessionAclPort {
  resolveCustomerIdByJti(jti: string): Promise<string | null>;
}

interface JwtPayload {
  jti: string;
}

interface RequestWithAuthHeaders {
  headers: Record<string, string | string[] | undefined>;
}

interface RequestWithCurrentUser extends RequestWithAuthHeaders {
  currentUser: {
    id: string;
    jti: string;
  };
}

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  private readonly accessTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CUSTOMER_SESSION_ACL)
    private readonly customerSessionAcl: CustomerSessionAclPort,
  ) {
    this.accessTokenSecret = this.configService.getOrThrow<string>(
      'jwt.accessToken',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCurrentUser>();
    const authHeader = request.headers['authorization'];
    const tokenValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (!tokenValue || !tokenValue.startsWith('Bearer ')) {
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.missingToken',
      });
    }

    const accessToken = tokenValue.slice(7);
    const payload = await this.verifyAccessToken(accessToken);
    const customerId = await this.resolveCustomerIdByJti(payload.jti);

    request.currentUser = {
      id: customerId,
      jti: payload.jti,
    };

    return true;
  }

  private async verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
        secret: this.accessTokenSecret,
      });
    } catch {
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.invalidToken',
      });
    }
  }

  private async resolveCustomerIdByJti(jti: string): Promise<string> {
    const customerId = await this.customerSessionAcl.resolveCustomerIdByJti(jti);

    if (!customerId) {
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.sessionExpired',
      });
    }

    return customerId;
  }
}
