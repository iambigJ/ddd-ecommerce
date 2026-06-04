import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository.port';
import type { CustomerRepositoryPort } from '../../domain/repositories/customer.repository.port';
import { LoginCustomerDto } from '../dto/login-customer.dto';
import {
  PASSWORD_HASHER,
} from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { CustomerAuthService } from '../../infrastructure/auth/customer-auth.service';
import { Email } from '../../domain/value-objects/email.value-object';
import { CustomerResponseMapper } from '../mappers/customer-response.mapper';

@Injectable()
export class LoginCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(LoginCustomerUseCase.name);
  }

  async execute(input: LoginCustomerDto): Promise<{
    customer: ReturnType<typeof CustomerResponseMapper.fromAggregate>;
    accessToken: string;
    refreshToken: string;
  }> {
    const normalizedEmail = new Email(input.email).getValue();
    const customer = await this.customerRepository.findByEmail(normalizedEmail);

    if (!customer) {
      this.logger.warn('Login failed: customer not found by email', {
        email: normalizedEmail,
      });
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.invalidCredentials',
      });
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      customer.getPasswordHash(),
    );

    if (!isPasswordValid) {
      this.logger.warn('Login failed: invalid password', {
        customerId: customer.getId(),
      });
      throw new CError({
        status: HttpStatus.UNAUTHORIZED,
        message: 'auth.invalidCredentials',
      });
    }

    const tokens = await this.customerAuthService.issueTokens(customer.getId());

    return {
      customer: CustomerResponseMapper.fromAggregate(customer),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
