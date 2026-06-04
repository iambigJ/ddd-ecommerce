import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CError } from '@ddd-ecommerce/shared';
import { WalletReservation } from '../../domain/value-objects/wallet-reservation.value-object';
import {
  WALLET_REPOSITORY,
  type WalletRepositoryPort,
} from '../../domain/repositories/wallet.repository.port';
import {
  WalletLedgerPort,
  WalletLedgerResult,
} from '../ports/wallet-ledger.port';

@Injectable()
export class WalletLedgerService implements WalletLedgerPort {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepositoryPort,
  ) {}

  async reserve(
    customerId: string,
    paymentId: string,
    idempotencyKey: string,
    amount: string,
  ): Promise<WalletReservation> {
    const wallet = await this.requireWallet(customerId);
    const reservation = wallet.reserve(
      randomUUID(),
      paymentId,
      idempotencyKey,
      amount,
    );
    await this.walletRepository.save(wallet);
    return reservation;
  }

  async commit(
    customerId: string,
    reservationId: string,
  ): Promise<WalletLedgerResult> {
    const wallet = await this.requireWallet(customerId);
    wallet.commit(reservationId);
    const saved = await this.walletRepository.save(wallet);
    return this.toResult(saved);
  }

  async release(
    customerId: string,
    reservationId: string,
  ): Promise<WalletLedgerResult> {
    const wallet = await this.requireWallet(customerId);
    wallet.release(reservationId);
    const saved = await this.walletRepository.save(wallet);
    return this.toResult(saved);
  }

  async reverse(customerId: string, paymentId: string): Promise<WalletLedgerResult> {
    const wallet = await this.requireWallet(customerId);
    wallet.reverseByPaymentId(paymentId);
    const saved = await this.walletRepository.save(wallet);
    return this.toResult(saved);
  }

  async directDebit(
    customerId: string,
    amount: string,
  ): Promise<WalletLedgerResult> {
    const wallet = await this.requireWallet(customerId);
    wallet.debit(amount);
    const saved = await this.walletRepository.save(wallet);
    return this.toResult(saved);
  }

  async directRefund(
    customerId: string,
    amount: string,
  ): Promise<WalletLedgerResult> {
    const wallet = await this.requireWallet(customerId);
    wallet.directRefund(amount);
    const saved = await this.walletRepository.save(wallet);
    return this.toResult(saved);
  }

  async getAvailableBalance(customerId: string): Promise<string> {
    const wallet = await this.walletRepository.findByCustomerId(customerId);
    return wallet?.getAvailableBalance() ?? '0.00';
  }

  private async requireWallet(customerId: string) {
    const wallet = await this.walletRepository.findByCustomerId(customerId);

    if (!wallet) {
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.walletNotFound',
      });
    }

    return wallet;
  }

  private toResult(wallet: {
    getCustomerId(): string;
    getBalance(): string;
    getCurrency(): string;
  }): WalletLedgerResult {
    return {
      customerId: wallet.getCustomerId(),
      balance: wallet.getBalance(),
      currency: wallet.getCurrency(),
    };
  }
}
