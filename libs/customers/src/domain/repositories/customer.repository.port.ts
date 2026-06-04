import { CustomerAggregate } from '../aggregates/customer.aggregate';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CustomerRepositoryPort {
  create(customer: CustomerAggregate): Promise<CustomerAggregate>;
  findByEmail(email: string): Promise<CustomerAggregate | null>;
  findById(id: string): Promise<CustomerAggregate | null>;
  update(customer: CustomerAggregate): Promise<CustomerAggregate>;
}
