import { Injectable } from '@nestjs/common';
import { CLogger } from '@ddd-ecommerce/shared';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { CustomerAuthService } from '../../infrastructure/auth/customer-auth.service';

@Injectable()
export class RefreshCustomerTokenUseCase {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(RefreshCustomerTokenUseCase.name);
  }

  async execute(input: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    this.logger.log('Refresh token requested');
    const tokens = await this.customerAuthService.refreshTokens(input.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
