import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { CLogger, JwtGlobalModule } from '@ddd-ecommerce/shared';
import { CustomersController } from '../../presentation/http/customers.controller';
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer.use-case';
import { LoginCustomerUseCase } from '../../application/use-cases/login-customer.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { RefreshCustomerTokenUseCase } from '../../application/use-cases/refresh-customer-token.use-case';
import { EditCustomerUseCase } from '../../application/use-cases/edit-customer.use-case';
import { LogoutCustomerUseCase } from '../../application/use-cases/logout-customer.use-case';
import { LogoutAllCustomerSessionsUseCase } from '../../application/use-cases/logout-all-customer-sessions.use-case';
import {
  CustomerRepositoryProvider,
  DrizzleCustomerRepository,
} from './repositories/drizzle-customer.repository';
import { BcryptPasswordHasherService } from '../auth/bcrypt-password-hasher.service';
import { PASSWORD_HASHER } from '../../application/ports/password-hasher.port';
import { IdentityModule } from './identity-global.module';
import { CustomerAuthService } from '../auth/customer-auth.service';

@Module({
  imports: [ConfigModule, CqrsModule, JwtGlobalModule, IdentityModule],
  controllers: [CustomersController],
  providers: [
    RegisterCustomerUseCase,
    LoginCustomerUseCase,
    GetMeUseCase,
    RefreshCustomerTokenUseCase,
    EditCustomerUseCase,
    CustomerAuthService,
    LogoutCustomerUseCase,
    LogoutAllCustomerSessionsUseCase,
    CLogger,
    DrizzleCustomerRepository,
    CustomerRepositoryProvider,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasherService,
    },
  ],
})
export class CustomersModule {}
