import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  CurrentUserDec,
  type CurrentUserPayload,
  CustomerAuthGuard,
} from '@ddd-ecommerce/shared';
import { GetMyPaymentsQuery } from '../../application/queries/get-my-payments.query';
import { GetPaymentByIdQuery } from '../../application/queries/get-payment-by-id.query';

@Controller('payments')
@UseGuards(CustomerAuthGuard)
export class PaymentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  listMine(@CurrentUserDec() customer: CurrentUserPayload) {
    return this.queryBus.execute(new GetMyPaymentsQuery(customer.id));
  }

  @Get(':paymentId')
  getById(
    @CurrentUserDec() customer: CurrentUserPayload,
    @Param('paymentId') paymentId: string,
  ) {
    return this.queryBus.execute(
      new GetPaymentByIdQuery(customer.id, paymentId),
    );
  }
}
