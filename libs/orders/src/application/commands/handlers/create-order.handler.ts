import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CError, CLogger, GetProductForOrderQuery, OrderCreatedEvent, OrderStatusEnum, ProductForOrderPort } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { OrderAggregate } from '../../../domain/aggregates/order.aggregate';
import { CreateOrderCommand } from '../create-order.command';
import { OrderResponse, OrderResponseMapper } from '../../mappers/order-response.mapper';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler
  implements ICommandHandler<CreateOrderCommand, OrderResponse>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(CreateOrderHandler.name);
  }

  async execute(command: CreateOrderCommand): Promise<OrderResponse> {
    const now = new Date();
    const order = OrderAggregate.create({
      id: randomUUID(),
      customerId: command.customerId,
      status: OrderStatusEnum.PENDING,
      items: [],
      createdAt: now,
      updatedAt: now,
    });

    const productPromises = command.items.map(async (item) => {
      const product = await this.queryBus.execute<
        GetProductForOrderQuery,
        ProductForOrderPort | null
      >(new GetProductForOrderQuery(item.productId));
      
      return { item, product };
    });
    
    const fetchedResults = await Promise.all(productPromises);
    
    for (const { item, product } of fetchedResults) {
      if (!product) {
        this.logger.warn('Product not found while creating order', {
          customerId: command.customerId,
          productId: item.productId,
        });
        throw new CError({
          status: HttpStatus.NOT_FOUND,
          message: 'products.notFound',
        });
      }
    
      if (product.stock < item.quantity) {
        this.logger.warn('Insufficient stock while creating order', {
          customerId: command.customerId,
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
        });
        throw new CError({
          status: HttpStatus.CONFLICT,
          message: 'products.insufficientStock',
        });
      }
    
      order.appendItem({
        id: randomUUID(),
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      });
    }

    const createdOrder = await this.orderRepository.create(order);
    this.eventBus.publish(
      new OrderCreatedEvent(
        createdOrder.getId(),
        createdOrder.getCustomerId(),
        createdOrder.getTotalAmount(),
      ),
    );

    return OrderResponseMapper.fromAggregate(createdOrder);
  }
}
