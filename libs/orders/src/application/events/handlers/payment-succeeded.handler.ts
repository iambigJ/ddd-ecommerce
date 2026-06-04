import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CLogger, PaymentSucceededEvent } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  type OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';

@EventsHandler(PaymentSucceededEvent)
export class OrderPaymentSucceededHandler
  implements IEventHandler<PaymentSucceededEvent>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(OrderPaymentSucceededHandler.name);
  }

  async handle(event: PaymentSucceededEvent): Promise<void> {
    const order = await this.orderRepository.findByIdForCustomer(
      event.orderId,
      event.customerId,
    );
    if (!order) {
      this.logger.warn('Order not found while handling payment success', {
        orderId: event.orderId,
        customerId: event.customerId,
      });
      return;
    }
    order.markPaid();
    await this.orderRepository.save(order);
  }
}
