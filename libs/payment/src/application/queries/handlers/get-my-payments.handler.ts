import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CLogger } from '@ddd-ecommerce/shared';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepositoryPort,
} from '../../../domain/repositories/payment.repository.port';
import { GetMyPaymentsQuery } from '../get-my-payments.query';
import {
  PaymentResponse,
  PaymentResponseMapper,
} from '../../mappers/payment-response.mapper';

@QueryHandler(GetMyPaymentsQuery)
export class GetMyPaymentsHandler
  implements IQueryHandler<GetMyPaymentsQuery, PaymentResponse[]>
{
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetMyPaymentsHandler.name);
  }

  async execute(query: GetMyPaymentsQuery): Promise<PaymentResponse[]> {
    const payments = await this.paymentRepository.findManyByCustomerId(
      query.customerId,
    );

    this.logger.debug('Listed customer payments', {
      customerId: query.customerId,
      count: payments.length,
    });

    return PaymentResponseMapper.fromAggregates(payments);
  }
}
