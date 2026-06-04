import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CError, CLogger, GetProductForOrderQuery, ProductForOrderPort } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { AppendOrderItemCommand } from '../append-order-item.command';
import { OrderResponse, OrderResponseMapper } from '../../mappers/order-response.mapper';

@CommandHandler(AppendOrderItemCommand)
export class AppendOrderItemHandler
  implements ICommandHandler<AppendOrderItemCommand, OrderResponse>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly queryBus: QueryBus,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(AppendOrderItemHandler.name);
  }

  async execute(command: AppendOrderItemCommand): Promise<OrderResponse> {
    const order = await this.orderRepository.findByIdForCustomer(
      command.orderId,
      command.customerId,
    );

    if (!order) {
      this.logger.warn('Order not found while appending item', {
        customerId: command.customerId,
        orderId: command.orderId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'orders.notFound',
      });
    }

    const product = await this.queryBus.execute<
      GetProductForOrderQuery,
      ProductForOrderPort | null
    >(new GetProductForOrderQuery(command.productId));

    if (!product) {
      this.logger.warn('Product not found while appending order item', {
        customerId: command.customerId,
        orderId: command.orderId,
        productId: command.productId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'products.notFound',
      });
    }

    order.appendItem({
      id: randomUUID(),
      productId: product.id,
      quantity: command.quantity,
      priceAtPurchase: product.price,
    });

    return OrderResponseMapper.fromAggregate(await this.orderRepository.save(order));
  }
}
