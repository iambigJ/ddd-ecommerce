import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CError, CLogger, CustomerCreatedEvent } from '@ddd-ecommerce/shared';
import {
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository.port';
import type { CustomerRepositoryPort } from '../../domain/repositories/customer.repository.port';
import { RegisterCustomerDto } from '../dto/register-customer.dto';
import { Email } from '../../domain/value-objects/email.value-object';
import { PasswordHash } from '../../domain/value-objects/password-hash.value-object';
import { CustomerId } from '../../domain/value-objects/customer-id.value-object';
import { CustomerAggregate } from '../../domain/aggregates/customer.aggregate';
import {
  PASSWORD_HASHER,
} from '../ports/password-hasher.port';
import type { PasswordHasherPort } from '../ports/password-hasher.port';
import { CustomerAuthService } from '../../infrastructure/auth/customer-auth.service';
import { CustomerResponseMapper } from '../mappers/customer-response.mapper';

@Injectable()
export class RegisterCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasherPort,
    private readonly customerAuthService: CustomerAuthService,
    private readonly logger: CLogger,
    private readonly eventBus: EventBus,
  ) {
    this.logger.setContext(RegisterCustomerUseCase.name);
  }

  async execute(input: RegisterCustomerDto): Promise<{
    customer: ReturnType<typeof CustomerResponseMapper.fromAggregate>;
    accessToken: string;
    refreshToken: string;
  }> {
    const email = new Email(input.email);
    const existingCustomer = await this.customerRepository.findByEmail(
      email.getValue(),
    );

    if (existingCustomer) {
      this.logger.warn('Registration failed: email already used', {
        email: email.getValue(),
      });
      throw new CError({
        status: HttpStatus.CONFLICT,
        message: 'customers.emailAlreadyUsed',
      });
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);
    const now = new Date();
    const customer = CustomerAggregate.create({
      id: new CustomerId(),
      name: input.name,
      email,
      passwordHash: new PasswordHash(hashedPassword),
      createdAt: now,
      updatedAt: now,
    });

    const createdCustomer = await this.customerRepository.create(customer);
    this.eventBus.publish(new CustomerCreatedEvent(createdCustomer.getId()));

    const tokens = await this.customerAuthService.issueTokens(
      createdCustomer.getId(),
    );

    return {
      customer: CustomerResponseMapper.fromAggregate(createdCustomer),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
