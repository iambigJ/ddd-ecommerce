import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  CUSTOMER_REPOSITORY,
} from '../../domain/repositories/customer.repository.port';
import type { CustomerRepositoryPort } from '../../domain/repositories/customer.repository.port';
import { CustomerResponseMapper } from '../mappers/customer-response.mapper';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetMeUseCase.name);
  }

  async execute(customerId: string): Promise<
    ReturnType<typeof CustomerResponseMapper.fromAggregate>
  > {
    const customer = await this.customerRepository.findById(customerId);

    if (!customer) {
      this.logger.warn('Customer not found while loading profile', { customerId });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'customers.notFound',
      });
    }

    return CustomerResponseMapper.fromAggregate(customer);
  }
}
