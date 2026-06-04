import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository.port';
import type { CustomerRepositoryPort } from '../../domain/repositories/customer.repository.port';
import { EditCustomerDto } from '../dto/edit-customer.dto';
import { CustomerResponseMapper } from '../mappers/customer-response.mapper';
import { Email } from '../../domain/value-objects/email.value-object';

@Injectable()
export class EditCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(EditCustomerUseCase.name);
  }

  async execute(
    customerId: string,
    input: EditCustomerDto,
  ): Promise<ReturnType<typeof CustomerResponseMapper.fromAggregate>> {
    const customer = await this.customerRepository.findById(customerId);

    if (!customer) {
      this.logger.warn('Customer not found for profile edit', { customerId });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'customers.notFound',
      });
    }

    if (input.email) {
      const normalizedEmail = new Email(input.email).getValue();
      const customerWithEmail = await this.customerRepository.findByEmail(
        normalizedEmail,
      );

      if (customerWithEmail && customerWithEmail.getId() !== customer.getId()) {
        this.logger.warn('Email conflict while editing customer', {
          customerId,
          email: normalizedEmail,
        });
        throw new CError({
          status: HttpStatus.CONFLICT,
          message: 'customers.emailAlreadyUsed',
        });
      }
    }

    customer.editProfile({
      name: input.name,
      email: input.email ? new Email(input.email) : undefined,
    });

    const updatedCustomer = await this.customerRepository.update(customer);
    return CustomerResponseMapper.fromAggregate(updatedCustomer);
  }
}
