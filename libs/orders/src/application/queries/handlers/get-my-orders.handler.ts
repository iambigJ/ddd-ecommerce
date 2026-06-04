import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CLogger } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { GetMyOrdersQuery } from '../get-my-orders.query';
import { OrderResponse, OrderResponseMapper } from '../../mappers/order-response.mapper';

@QueryHandler(GetMyOrdersQuery)
export class GetMyOrdersHandler
  implements IQueryHandler<GetMyOrdersQuery, OrderResponse[]>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetMyOrdersHandler.name);
  }

  async execute(query: GetMyOrdersQuery): Promise<OrderResponse[]> {
    return (await this.orderRepository.listByCustomer(query.customerId)).map(
      (order) => OrderResponseMapper.fromAggregate(order),
    );
  }
}
