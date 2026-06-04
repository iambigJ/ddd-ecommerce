import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CError, CLogger, PaymentInitiatedEvent } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { CheckoutOrderCommand } from '../checkout-order.command';
import { OrderResponse, OrderResponseMapper } from '../../mappers/order-response.mapper';

@CommandHandler(CheckoutOrderCommand)
export class CheckoutOrderHandler
  implements ICommandHandler<CheckoutOrderCommand, OrderResponse>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly eventBus: EventBus,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(CheckoutOrderHandler.name);
  }

  async execute(command: CheckoutOrderCommand): Promise<OrderResponse> {


    const order = await this.orderRepository.findByIdForCustomer(
      command.orderId,
      command.customerId,
    );

    if (!order) {
      this.logger.warn('Checkout rejected: order not found', {
        customerId: command.customerId,
        orderId: command.orderId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'orders.notFound',
      });
    }

    order.assertCanCheckout();
    order.markProcessing();
    const savedOrder = await this.orderRepository.save(order);

    this.eventBus.publish(
      new PaymentInitiatedEvent(
        randomUUID(),
        savedOrder.getId(),
        savedOrder.getCustomerId(),
        savedOrder.getTotalAmount(),
        command.paymentMode,
        command.preferredProvider,
        command.paymentMethodId,
        command.idempotencyKey,
      ),
    );

    return OrderResponseMapper.fromAggregate(savedOrder);
  }
}
