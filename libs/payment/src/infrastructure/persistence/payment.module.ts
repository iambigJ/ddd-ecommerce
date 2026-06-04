import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { CLogger } from '@ddd-ecommerce/shared';
import { PaymentCustomerCreatedHandler } from '../../application/events/handlers/customer-created.handler';
import { PaymentInitiatedHandler } from '../../application/events/handlers/payment-initiated.handler';
import { ChargeWalletHandler } from '../../application/commands/handlers/charge-wallet.handler';
import { GetPaymentByOrderIdHandler } from '../../application/queries/handlers/get-payment-by-order-id.handler';
import { GetPaymentByIdHandler } from '../../application/queries/handlers/get-payment-by-id.handler';
import { GetMyPaymentsHandler } from '../../application/queries/handlers/get-my-payments.handler';
import { EXTERNAL_PAYMENT_PORT } from '../../application/ports/external-payment.port';
import { WALLET_LEDGER } from '../../application/ports/wallet-ledger.port';
import { ORDER_OWNERSHIP } from '../../application/ports/order-ownership.port';
import { ProcessPaymentService } from '../../application/services/process-payment.service';
import { WalletLedgerService } from '../../application/services/wallet-ledger.service';
import { OrderOwnershipAdapter } from '../adapters/order-ownership.adapter';
import {
  DrizzlePaymentRepository,
  PaymentRepositoryProvider,
} from './repositories/drizzle-payment.repository';
import {
  DrizzleWalletRepository,
  WalletRepositoryProvider,
} from './repositories/drizzle-wallet.repository';
import { PaymentProviderRegistry } from '../providers/payment-provider.registry';
import { PayPalMockPaymentProvider } from '../providers/paypal-mock-payment.provider';
import { StripeMockPaymentProvider } from '../providers/stripe-mock-payment.provider';
import { WalletController } from '../../presentation/http/wallet.controller';
import { PaymentsController } from '../../presentation/http/payments.controller';
import { OrderPaymentController } from '../../presentation/http/order-payment.controller';

const eventHandlers = [PaymentCustomerCreatedHandler, PaymentInitiatedHandler];
const commandHandlers = [ChargeWalletHandler];
const queryHandlers = [
  GetPaymentByOrderIdHandler,
  GetPaymentByIdHandler,
  GetMyPaymentsHandler,
];

@Module({
  imports: [ConfigModule, CqrsModule],
  controllers: [WalletController, PaymentsController, OrderPaymentController],
  providers: [
    DrizzlePaymentRepository,
    DrizzleWalletRepository,
    PaymentRepositoryProvider,
    WalletRepositoryProvider,
    StripeMockPaymentProvider,
    PayPalMockPaymentProvider,
    PaymentProviderRegistry,
    {
      provide: EXTERNAL_PAYMENT_PORT,
      useExisting: PaymentProviderRegistry,
    },
    WalletLedgerService,
    {
      provide: WALLET_LEDGER,
      useExisting: WalletLedgerService,
    },
    ProcessPaymentService,
    OrderOwnershipAdapter,
    {
      provide: ORDER_OWNERSHIP,
      useExisting: OrderOwnershipAdapter,
    },
    CLogger,
    ...commandHandlers,
    ...eventHandlers,
    ...queryHandlers,
  ],
  exports: [PaymentRepositoryProvider, WalletRepositoryProvider],
})
export class PaymentModule {}
