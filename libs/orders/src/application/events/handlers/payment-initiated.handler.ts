import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CLogger, PaymentInitiatedEvent } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';

@EventsHandler(PaymentInitiatedEvent)
export class OrderPaymentInitiatedHandler
  implements IEventHandler<PaymentInitiatedEvent>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(OrderPaymentInitiatedHandler.name);
  }

  async handle(event: PaymentInitiatedEvent): Promise<void> {
    const order = await this.orderRepository.findByIdForCustomer(
      event.orderId,
      event.customerId,
    );
    if (!order) {
      this.logger.warn('Order not found while handling payment initiation', {
        orderId: event.orderId,
        customerId: event.customerId,
      });
      return;
    }
    order.markProcessing();
    await this.orderRepository.save(order);
  }
}
