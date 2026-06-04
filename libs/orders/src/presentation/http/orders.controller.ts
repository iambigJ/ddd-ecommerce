import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CurrentUserDec,
  type CurrentUserPayload,
  CustomerAuthGuard,
} from '@ddd-ecommerce/shared';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { AppendOrderItemDto } from '../../application/dto/append-order-item.dto';
import { CheckoutOrderDto } from '../../application/dto/checkout-order.dto';
import { CreateOrderCommand } from '../../application/commands/create-order.command';
import { AppendOrderItemCommand } from '../../application/commands/append-order-item.command';
import { RemoveOrderItemCommand } from '../../application/commands/remove-order-item.command';
import { CheckoutOrderCommand } from '../../application/commands/checkout-order.command';
import { GetMyOrdersQuery } from '../../application/queries/get-my-orders.query';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id.query';
import { OrderIdempotencyInterceptor } from '../interceptors/order-idempotency.interceptor';

@Controller('orders')
@UseGuards(CustomerAuthGuard)
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseInterceptors(OrderIdempotencyInterceptor)
  create(@CurrentUserDec() customer: CurrentUserPayload, @Body() input: CreateOrderDto) {
    return this.commandBus.execute(new CreateOrderCommand(customer.id, input.items));
  }

  @Get()
  listMine(@CurrentUserDec() customer: CurrentUserPayload) {
    return this.queryBus.execute(new GetMyOrdersQuery(customer.id));
  }

  @Get(':id')
  getById(@CurrentUserDec() customer: CurrentUserPayload, @Param('id') id: string) {
    return this.queryBus.execute(new GetOrderByIdQuery(customer.id, id));
  }

  @Post(':id/items')
  appendItem(
    @CurrentUserDec() customer: CurrentUserPayload,
    @Param('id') id: string,
    @Body() input: AppendOrderItemDto,
  ) {
    return this.commandBus.execute(
      new AppendOrderItemCommand(customer.id, id, input.productId, input.quantity),
    );
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @CurrentUserDec() customer: CurrentUserPayload,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.commandBus.execute(new RemoveOrderItemCommand(customer.id, id, itemId));
  }

  @Post(':id/checkout')
  checkout(
    @CurrentUserDec() customer: CurrentUserPayload,
    @Param('id') id: string,
    @Body() input: CheckoutOrderDto,
  ) {
    return this.commandBus.execute(
      new CheckoutOrderCommand(
        customer.id,
        id,
        input.idempotencyKey,
        input.paymentMode,
        input.preferredProvider,
        input.paymentMethodId,
      ),
    );
  }
}
