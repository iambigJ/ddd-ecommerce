import { WalletReservationStatusEnum } from '@ddd-ecommerce/shared';

export interface WalletReservationRecord {
  id: string;
  paymentId: string;
  idempotencyKey: string;
  amount: string;
  status: WalletReservationStatusEnum;
  createdAt: string;
  updatedAt: string;
}

export class WalletReservation {
  private readonly id: string;
  private readonly paymentId: string;
  private readonly idempotencyKey: string;
  private readonly amount: string;
  private status: WalletReservationStatusEnum;
  private readonly createdAt: string;
  private updatedAt: string;

  private constructor(record: WalletReservationRecord) {
    this.id = record.id;
    this.paymentId = record.paymentId;
    this.idempotencyKey = record.idempotencyKey;
    this.amount = record.amount;
    this.status = record.status;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }

  static create(record: WalletReservationRecord): WalletReservation {
    return new WalletReservation(record);
  }

  static fromHeld(
    id: string,
    paymentId: string,
    idempotencyKey: string,
    amount: string,
    now: Date = new Date(),
  ): WalletReservation {
    const iso = now.toISOString();
    return new WalletReservation({
      id,
      paymentId,
      idempotencyKey,
      amount,
      status: WalletReservationStatusEnum.HELD,
      createdAt: iso,
      updatedAt: iso,
    });
  }

  getId(): string {
    return this.id;
  }

  getPaymentId(): string {
    return this.paymentId;
  }

  getIdempotencyKey(): string {
    return this.idempotencyKey;
  }

  getAmount(): string {
    return this.amount;
  }

  getStatus(): WalletReservationStatusEnum {
    return this.status;
  }

  isHeld(): boolean {
    return this.status === WalletReservationStatusEnum.HELD;
  }

  isCommitted(): boolean {
    return this.status === WalletReservationStatusEnum.COMMITTED;
  }

  markCommitted(now: Date = new Date()): void {
    this.status = WalletReservationStatusEnum.COMMITTED;
    this.updatedAt = now.toISOString();
  }

  markReleased(now: Date = new Date()): void {
    this.status = WalletReservationStatusEnum.RELEASED;
    this.updatedAt = now.toISOString();
  }

  toRecord(): WalletReservationRecord {
    return {
      id: this.id,
      paymentId: this.paymentId,
      idempotencyKey: this.idempotencyKey,
      amount: this.amount,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
