import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DzService } from '@ddd-ecommerce/shared';
import {
  WALLET_REPOSITORY,
  WalletRepositoryPort,
} from '../../../domain/repositories/wallet.repository.port';
import { WalletAggregate } from '../../../domain/aggregates/wallet.aggregate';
import { WalletReservationRecord } from '../../../domain/value-objects/wallet-reservation.value-object';
import { wallets } from '../data-model/payment.schema';

@Injectable()
export class DrizzleWalletRepository implements WalletRepositoryPort {
  constructor(
    @Inject(DzService)
    private readonly drizzleService: DzService<{ wallets: typeof wallets }>,
  ) {}

  async createIfNotExists(customerId: string): Promise<WalletAggregate> {
    const existingWallet = await this.findByCustomerId(customerId);
    if (existingWallet) return existingWallet;

    const [wallet] = await this.drizzleService
      .getDb()
      .insert(wallets)
      .values({
        id: randomUUID(),
        customerId,
        balance: '0.00',
        currency: 'USD',
        reservations: [],
        version: 1,
        updatedAt: new Date(),
      })
      .returning();

    return this.toAggregate(wallet);
  }

  async findByCustomerId(customerId: string): Promise<WalletAggregate | null> {
    const [wallet] = await this.drizzleService
      .getDb()
      .select()
      .from(wallets)
      .where(eq(wallets.customerId, customerId))
      .limit(1);

    return wallet ? this.toAggregate(wallet) : null;
  }

  async save(wallet: WalletAggregate): Promise<WalletAggregate> {
    const [updatedWallet] = await this.drizzleService
      .getDb()
      .update(wallets)
      .set({
        balance: wallet.getBalance(),
        reservations: wallet.getReservations(),
        version: wallet.getVersion(),
        updatedAt: wallet.getUpdatedAt(),
      })
      .where(eq(wallets.id, wallet.getId()))
      .returning();

    return this.toAggregate(updatedWallet);
  }

  private toAggregate(wallet: typeof wallets.$inferSelect): WalletAggregate {
    return WalletAggregate.create({
      id: wallet.id,
      customerId: wallet.customerId,
      balance: wallet.balance,
      currency: wallet.currency,
      reservations: (wallet.reservations ?? []) as WalletReservationRecord[],
      version: wallet.version,
      updatedAt: wallet.updatedAt,
    });
  }
}

export const WalletRepositoryProvider = {
  provide: WALLET_REPOSITORY,
  useClass: DrizzleWalletRepository,
};
