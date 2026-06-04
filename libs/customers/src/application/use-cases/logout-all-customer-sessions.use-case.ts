import { Injectable } from '@nestjs/common';
import { CLogger } from '@ddd-ecommerce/shared';
import { CustomerAuthService } from '../../infrastructure/auth/customer-auth.service';

@Injectable()
export class LogoutAllCustomerSessionsUseCase {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(LogoutAllCustomerSessionsUseCase.name);
  }

  async execute(customerId: string): Promise<void> {
    this.logger.log('Logout all sessions requested', { customerId });
    await this.customerAuthService.logoutEverywhere(customerId);
  }
}
