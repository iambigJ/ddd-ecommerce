import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CLogger, GetCustomerOrderIdsQuery } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';

@QueryHandler(GetCustomerOrderIdsQuery)
export class GetCustomerOrderIdsHandler
  implements IQueryHandler<GetCustomerOrderIdsQuery, string[]>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetCustomerOrderIdsHandler.name);
  }

  async execute(query: GetCustomerOrderIdsQuery): Promise<string[]> {
    const orders = await this.orderRepository.listByCustomer(query.customerId);
    return orders.map((order) => order.getId());
  }
}
