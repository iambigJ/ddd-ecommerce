import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CError, CLogger, WalletChargeActionEnum } from '@ddd-ecommerce/shared';
import {
  WALLET_REPOSITORY,
  type WalletRepositoryPort,
} from '../../../domain/repositories/wallet.repository.port';
import { WALLET_LEDGER, type WalletLedgerPort } from '../../ports/wallet-ledger.port';
import { ChargeWalletCommand } from '../charge-wallet.command';

interface ChargeWalletResponse {
  customerId: string;
  balance: string;
  currency: string;
}

@CommandHandler(ChargeWalletCommand)
export class ChargeWalletHandler
  implements ICommandHandler<ChargeWalletCommand, ChargeWalletResponse>
{
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepositoryPort,
    @Inject(WALLET_LEDGER)
    private readonly walletLedger: WalletLedgerPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(ChargeWalletHandler.name);
  }

  async execute(command: ChargeWalletCommand): Promise<ChargeWalletResponse> {
    await this.walletRepository.createIfNotExists(command.customerId);

    if (!command.amount.trim()) {
      this.logger.warn('Charge wallet failed: invalid amount', {
        customerId: command.customerId,
        action: command.action,
      });
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'payments.invalidAmount',
      });
    }

    if (command.action === WalletChargeActionEnum.INCREASE) {
      return this.walletLedger.directRefund(command.customerId, command.amount);
    }

    return this.walletLedger.directDebit(command.customerId, command.amount);
  }
}
