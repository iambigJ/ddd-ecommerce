import { WalletAggregate } from '../aggregates/wallet.aggregate';

export const WALLET_REPOSITORY = Symbol.for(
  '@ddd-ecommerce/payment/WALLET_REPOSITORY',
);

export interface WalletRepositoryPort {
  createIfNotExists(customerId: string): Promise<WalletAggregate>;
  findByCustomerId(customerId: string): Promise<WalletAggregate | null>;
  save(wallet: WalletAggregate): Promise<WalletAggregate>;
}
