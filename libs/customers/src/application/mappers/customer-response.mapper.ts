import { CustomerAggregate } from '../../domain/aggregates/customer.aggregate';

export interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerResponseMapper {
  static fromAggregate(customer: CustomerAggregate): CustomerResponse {
    return {
      id: customer.getId(),
      name: customer.getName(),
      email: customer.getEmail(),
      createdAt: customer.getCreatedAt(),
      updatedAt: customer.getUpdatedAt(),
    };
  }
}
