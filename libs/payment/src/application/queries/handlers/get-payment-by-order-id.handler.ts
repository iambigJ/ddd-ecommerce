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
import { GetPaymentByOrderIdQuery } from '../get-payment-by-order-id.query';
import {
  PaymentResponse,
  PaymentResponseMapper,
} from '../../mappers/payment-response.mapper';

@QueryHandler(GetPaymentByOrderIdQuery)
export class GetPaymentByOrderIdHandler
  implements IQueryHandler<GetPaymentByOrderIdQuery, PaymentResponse>
{
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
    @Inject(ORDER_OWNERSHIP)
    private readonly orderOwnership: OrderOwnershipPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetPaymentByOrderIdHandler.name);
  }

  async execute(query: GetPaymentByOrderIdQuery): Promise<PaymentResponse> {
    const isOwner = await this.orderOwnership.isOrderOwnedByCustomer(
      query.orderId,
      query.customerId,
    );

    if (!isOwner) {
      this.logger.warn('Payment lookup rejected: order not owned by customer', {
        customerId: query.customerId,
        orderId: query.orderId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.notFound',
      });
    }

    const payment = await this.paymentRepository.findByOrderId(query.orderId);
    if (!payment) {
      this.logger.warn('Payment not found for order', {
        customerId: query.customerId,
        orderId: query.orderId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.notFound',
      });
    }

    return PaymentResponseMapper.fromAggregate(payment);
  }
}
