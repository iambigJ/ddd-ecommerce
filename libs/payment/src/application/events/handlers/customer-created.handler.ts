import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CLogger, CustomerCreatedEvent } from '@ddd-ecommerce/shared';
import {
  WALLET_REPOSITORY,
  type WalletRepositoryPort,
} from '../../../domain/repositories/wallet.repository.port';

@EventsHandler(CustomerCreatedEvent)
export class PaymentCustomerCreatedHandler
  implements IEventHandler<CustomerCreatedEvent>
{
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(PaymentCustomerCreatedHandler.name);
  }

  async handle(event: CustomerCreatedEvent): Promise<void> {
    await this.walletRepository.createIfNotExists(event.customerId);
  }
}
