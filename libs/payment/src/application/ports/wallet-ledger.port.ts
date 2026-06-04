import { WalletReservation } from '../../domain/value-objects/wallet-reservation.value-object';

export const WALLET_LEDGER = Symbol.for('@ddd-ecommerce/peyment/WALLET_LEDGER');

export interface WalletLedgerResult {
  customerId: string;
  balance: string;
  currency: string;
}

export interface WalletLedgerPort {
  reserve(
    customerId: string,
    paymentId: string,
    idempotencyKey: string,
    amount: string,
  ): Promise<WalletReservation>;

  commit(customerId: string, reservationId: string): Promise<WalletLedgerResult>;

  release(customerId: string, reservationId: string): Promise<WalletLedgerResult>;

  reverse(customerId: string, paymentId: string): Promise<WalletLedgerResult>;

  directDebit(customerId: string, amount: string): Promise<WalletLedgerResult>;

  directRefund(customerId: string, amount: string): Promise<WalletLedgerResult>;

  getAvailableBalance(customerId: string): Promise<string>;
}
