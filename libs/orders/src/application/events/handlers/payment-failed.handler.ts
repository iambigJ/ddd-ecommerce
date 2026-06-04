import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CLogger, PaymentFailedEvent } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';

@EventsHandler(PaymentFailedEvent)
export class OrderPaymentFailedHandler
  implements IEventHandler<PaymentFailedEvent>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(OrderPaymentFailedHandler.name);
  }

  async handle(event: PaymentFailedEvent): Promise<void> {
    const order = await this.orderRepository.findByIdForCustomer(
      event.orderId,
      event.customerId,
    );
    if (!order) {
      this.logger.warn('Order not found while handling payment failure', {
        orderId: event.orderId,
        customerId: event.customerId,
      });
      return;
    }
    order.markFailed();
    await this.orderRepository.save(order);
  }
}
