import { HttpStatus, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepositoryPort,
} from '../../../domain/repositories/payment.repository.port';
import {
  ORDER_OWNERSHIP,
  type OrderOwnershipPort,
} from '../../ports/order-ownership.port';
import { GetPaymentByIdQuery } from '../get-payment-by-id.query';
import {
  PaymentResponse,
  PaymentResponseMapper,
} from '../../mappers/payment-response.mapper';

@QueryHandler(GetPaymentByIdQuery)
export class GetPaymentByIdHandler
  implements IQueryHandler<GetPaymentByIdQuery, PaymentResponse>
{
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(ORDER_OWNERSHIP)
    private readonly orderOwnership: OrderOwnershipPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetPaymentByIdHandler.name);
  }

  async execute(query: GetPaymentByIdQuery): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(query.paymentId);
    if (!payment) {
      this.logger.warn('Payment not found by id', {
        customerId: query.customerId,
        paymentId: query.paymentId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.notFound',
      });
    }

    const isOwner = await this.orderOwnership.isOrderOwnedByCustomer(
      payment.getOrderId(),
      query.customerId,
    );

    if (!isOwner) {
      this.logger.warn('Payment lookup rejected: order not owned by customer', {
        customerId: query.customerId,
        paymentId: query.paymentId,
        orderId: payment.getOrderId(),
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.notFound',
      });
    }

    return PaymentResponseMapper.fromAggregate(payment);
  }
}
