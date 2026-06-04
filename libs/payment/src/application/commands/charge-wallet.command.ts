import { WalletChargeActionEnum } from '@ddd-ecommerce/shared';

export class ChargeWalletCommand {
  constructor(
    public readonly customerId: string,
    public readonly amount: string,
    public readonly action: WalletChargeActionEnum,
  ) {}
}

