import { HttpStatus, Inject } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  CError,
  CLogger,
  PaymentFailedEvent,
  PaymentInitiatedEvent,
  PaymentStatusEnum,
  PaymentSucceededEvent,
} from '@ddd-ecommerce/shared';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepositoryPort,
} from '../../../domain/repositories/payment.repository.port';
import { PaymentAggregate } from '../../../domain/aggregates/payment.aggregate';
import { ProcessPaymentService } from '../../services/process-payment.service';

@EventsHandler(PaymentInitiatedEvent)
export class PaymentInitiatedHandler
  implements IEventHandler<PaymentInitiatedEvent>
{
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly processPayment: ProcessPaymentService,
    private readonly eventBus: EventBus,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(PaymentInitiatedHandler.name);
  }

  async handle(event: PaymentInitiatedEvent): Promise<void> {
    const existingPayment = await this.paymentRepository.findByIdempotencyKey(
      event.idempotencyKey,
    );

    if (existingPayment) {
      if (existingPayment.getOrderId() !== event.orderId) {
        this.logger.warn('Payment idempotency conflict detected', {
          paymentId: existingPayment.getId(),
          orderId: event.orderId,
          idempotencyKey: event.idempotencyKey,
        });
        throw new CError({
          status: HttpStatus.CONFLICT,
          message: 'payments.idempotencyConflict',
        });
      }
      return;
    }

    const now = new Date();
    const payment = await this.paymentRepository.create(
      PaymentAggregate.create({
        id: event.paymentId,
        orderId: event.orderId,
        amount: event.amount,
        status: PaymentStatusEnum.PENDING,
        idempotencyKey: event.idempotencyKey,
        attempts: [],
        createdAt: now,
        updatedAt: now,
      }),
    );

    const result = await this.processPayment.execute(payment, event);
    const finalPayment = await this.paymentRepository.save(payment);

    if (result.success) {
      this.eventBus.publish(
        new PaymentSucceededEvent(
          finalPayment.getId(),
          event.orderId,
          event.customerId,
          event.amount,
          result.provider,
        ),
      );
      return;
    }

    this.eventBus.publish(
      new PaymentFailedEvent(
        finalPayment.getId(),
        event.orderId,
        event.customerId,
        event.amount,
        result.errorMessage ?? 'payments.allProvidersFailed',
      ),
    );
  }
}
