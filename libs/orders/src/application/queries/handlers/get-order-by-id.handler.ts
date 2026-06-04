import { HttpStatus, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { GetOrderByIdQuery } from '../get-order-by-id.query';
import { OrderResponse, OrderResponseMapper } from '../../mappers/order-response.mapper';

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler
  implements IQueryHandler<GetOrderByIdQuery, OrderResponse>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetOrderByIdHandler.name);
  }

  async execute(query: GetOrderByIdQuery): Promise<OrderResponse> {
    const order = await this.orderRepository.findByIdForCustomer(
      query.orderId,
      query.customerId,
    );

    if (!order) {
      this.logger.warn('Order not found for customer', {
        customerId: query.customerId,
        orderId: query.orderId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'orders.notFound',
      });
    }

    return OrderResponseMapper.fromAggregate(order);
  }
}
