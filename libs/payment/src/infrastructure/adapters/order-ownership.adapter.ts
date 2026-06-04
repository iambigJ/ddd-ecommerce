import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { VerifyOrderOwnershipQuery } from '@ddd-ecommerce/shared';
import type { OrderOwnershipPort } from '../../application/ports/order-ownership.port';

@Injectable()
export class OrderOwnershipAdapter implements OrderOwnershipPort {
  constructor(private readonly queryBus: QueryBus) {}

  async isOrderOwnedByCustomer(
    orderId: string,
    customerId: string,
  ): Promise<boolean> {
    return this.queryBus.execute<VerifyOrderOwnershipQuery, boolean>(
      new VerifyOrderOwnershipQuery(orderId, customerId),
    );
  }
}
