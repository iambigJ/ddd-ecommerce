import { Injectable } from '@nestjs/common';
import { CLogger } from '@ddd-ecommerce/shared';
import { CustomerAuthService } from '../../infrastructure/auth/customer-auth.service';

@Injectable()
export class LogoutCustomerUseCase {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(LogoutCustomerUseCase.name);
  }

  async execute(jti: string): Promise<void> {
    this.logger.log('Logout session requested', { jti });
    await this.customerAuthService.logoutSession(jti);
  }
}
