import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  CurrentUserDec,
  type CurrentUserPayload,
  CustomerAuthGuard,
} from '@ddd-ecommerce/shared';
import { GetPaymentByOrderIdQuery } from '../../application/queries/get-payment-by-order-id.query';

@Controller('orders')
@UseGuards(CustomerAuthGuard)
export class OrderPaymentController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':orderId/payment')
  getByOrderId(
    @CurrentUserDec() customer: CurrentUserPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.queryBus.execute(
      new GetPaymentByOrderIdQuery(customer.id, orderId),
    );
  }
}
