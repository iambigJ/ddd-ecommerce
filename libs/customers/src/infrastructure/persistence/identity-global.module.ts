import { CUSTOMER_SESSION_ACL } from '@ddd-ecommerce/shared';
import { Module, Global } from '@nestjs/common';
import { CustomerAuthService } from '../auth/customer-auth.service';


@Global()
@Module({
  providers: [
    {
      provide: CUSTOMER_SESSION_ACL,
      useClass: CustomerAuthService, 
    },
  ],
  exports: [CUSTOMER_SESSION_ACL], 
})
export class IdentityModule {}