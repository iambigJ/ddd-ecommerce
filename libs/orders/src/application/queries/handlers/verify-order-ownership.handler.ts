import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CLogger, VerifyOrderOwnershipQuery } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';

@QueryHandler(VerifyOrderOwnershipQuery)
export class VerifyOrderOwnershipHandler
  implements IQueryHandler<VerifyOrderOwnershipQuery, boolean>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(VerifyOrderOwnershipHandler.name);
  }

  async execute(query: VerifyOrderOwnershipQuery): Promise<boolean> {
    const order = await this.orderRepository.findByIdForCustomer(
      query.orderId,
      query.customerId,
    );

    return order !== null;
  }
}
