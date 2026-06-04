import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { RemoveOrderItemCommand } from '../remove-order-item.command';
import { OrderResponse, OrderResponseMapper } from '../../mappers/order-response.mapper';

@CommandHandler(RemoveOrderItemCommand)
export class RemoveOrderItemHandler
  implements ICommandHandler<RemoveOrderItemCommand, OrderResponse>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(RemoveOrderItemHandler.name);
  }

  async execute(command: RemoveOrderItemCommand): Promise<OrderResponse> {
    const order = await this.orderRepository.findByIdForCustomer(
      command.orderId,
      command.customerId,
    );

    if (!order) {
      this.logger.warn('Order not found while removing item', {
        customerId: command.customerId,
        orderId: command.orderId,
        itemId: command.itemId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'orders.notFound',
      });
    }

    order.removeItem(command.itemId);

    return OrderResponseMapper.fromAggregate(await this.orderRepository.save(order));
  }
}
