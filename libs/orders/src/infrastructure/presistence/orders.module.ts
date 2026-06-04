import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CLogger } from '@ddd-ecommerce/shared';
import { DddEcommerceProductsModule } from '@ddd-ecommerce/products';
import { OrdersController } from '../../presentation/http/orders.controller';
import { OrderIdempotencyInterceptor } from '../../presentation/interceptors/order-idempotency.interceptor';
import { CreateOrderHandler } from '../../application/commands/handlers/create-order.handler';
import { AppendOrderItemHandler } from '../../application/commands/handlers/append-order-item.handler';
import { RemoveOrderItemHandler } from '../../application/commands/handlers/remove-order-item.handler';
import { CheckoutOrderHandler } from '../../application/commands/handlers/checkout-order.handler';
import { GetMyOrdersHandler } from '../../application/queries/handlers/get-my-orders.handler';
import { GetOrderByIdHandler } from '../../application/queries/handlers/get-order-by-id.handler';
import { VerifyOrderOwnershipHandler } from '../../application/queries/handlers/verify-order-ownership.handler';
import { OrderPaymentInitiatedHandler } from '../../application/events/handlers/payment-initiated.handler';
import { OrderPaymentSucceededHandler } from '../../application/events/handlers/payment-succeeded.handler';
import { OrderPaymentFailedHandler } from '../../application/events/handlers/payment-failed.handler';
import {
  DrizzleOrderRepository,
  OrderRepositoryProvider,
} from './repositories/drizzle-order.repository';

const commandHandlers = [
  CreateOrderHandler,
  AppendOrderItemHandler,
  RemoveOrderItemHandler,
  CheckoutOrderHandler,
];

const queryHandlers = [
  GetMyOrdersHandler,
  GetOrderByIdHandler,
  VerifyOrderOwnershipHandler,
];

const eventHandlers = [
  OrderPaymentInitiatedHandler,
  OrderPaymentSucceededHandler,
  OrderPaymentFailedHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [OrdersController],
  providers: [
    DrizzleOrderRepository,
    OrderRepositoryProvider,
    CLogger,
    OrderIdempotencyInterceptor,
    ...commandHandlers,
    ...queryHandlers,
    ...eventHandlers,
  ],
  exports: [OrderRepositoryProvider],
})
export class OrdersModule {}
