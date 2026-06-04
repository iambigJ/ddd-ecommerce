import { HttpStatus } from '@nestjs/common';
import { CError, WalletReservationStatusEnum } from '@ddd-ecommerce/shared';
import {
  WalletReservation,
  WalletReservationRecord,
} from '../value-objects/wallet-reservation.value-object';

export interface WalletAggregateProps {
  id: string;
  customerId: string;
  balance: string;
  currency: string;
  reservations?: WalletReservationRecord[];
  version: number;
  updatedAt: Date;
}

export class WalletAggregate {
  private readonly id: string;
  private readonly customerId: string;
  private balance: string;
  private readonly currency: string;
  private reservations: WalletReservation[];
  private version: number;
  private updatedAt: Date;

  private constructor(props: WalletAggregateProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.balance = this.normalizeAmount(props.balance);
    this.currency = props.currency;
    this.reservations = (props.reservations ?? []).map((record) =>
      WalletReservation.create(record),
    );
    this.version = props.version;
    this.updatedAt = props.updatedAt;
  }

  static create(props: WalletAggregateProps): WalletAggregate {
    return new WalletAggregate(props);
  }

  getId(): string {
    return this.id;
  }

  getCustomerId(): string {
    return this.customerId;
  }

  getBalance(): string {
    return this.balance;
  }

  getAvailableBalance(): string {
    const heldTotal = this.reservations
      .filter((reservation) => reservation.isHeld())
      .reduce((sum, reservation) => sum + Number(reservation.getAmount()), 0);

    return (Number(this.balance) - heldTotal).toFixed(2);
  }

  getCurrency(): string {
    return this.currency;
  }

  getVersion(): number {
    return this.version;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getReservations(): WalletReservationRecord[] {
    return this.reservations.map((reservation) => reservation.toRecord());
  }

  findHeldReservationByPaymentId(paymentId: string): WalletReservation | null {
    return (
      this.reservations.find(
        (reservation) =>
          reservation.getPaymentId() === paymentId && reservation.isHeld(),
      ) ?? null
    );
  }

  reserve(
    reservationId: string,
    paymentId: string,
    idempotencyKey: string,
    amount: string,
  ): WalletReservation {
    const normalizedAmount = this.normalizeAmount(amount);
    const existing = this.findHeldReservationByPaymentId(paymentId);

    if (existing) {
      if (existing.getAmount() !== normalizedAmount) {
        throw new CError({
          status: HttpStatus.CONFLICT,
          message: 'payments.reservationConflict',
        });
      }
      return existing;
    }

    if (Number(this.getAvailableBalance()) < Number(normalizedAmount)) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'payments.walletInsufficientBalance',
      });
    }

    const reservation = WalletReservation.fromHeld(
      reservationId,
      paymentId,
      idempotencyKey,
      normalizedAmount,
    );
    this.reservations.push(reservation);
    this.touch();
    return reservation;
  }

  commit(reservationId: string): void {
    const reservation = this.findReservationOrThrow(reservationId);

    if (reservation.isCommitted()) {
      return;
    }

    if (!reservation.isHeld()) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'payments.reservationNotHeld',
      });
    }

    this.debit(reservation.getAmount(), false);
    reservation.markCommitted();
    this.compactReservations();
    this.touch();
  }

  release(reservationId: string): void {
    const reservation = this.findReservationOrThrow(reservationId);

    if (reservation.getStatus() === WalletReservationStatusEnum.RELEASED) {
      return;
    }

    if (!reservation.isHeld()) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'payments.reservationNotHeld',
      });
    }

    reservation.markReleased();
    this.compactReservations();
    this.touch();
  }

  reverseByPaymentId(paymentId: string): string {
    const reservation = this.reservations.find(
      (item) =>
        item.getPaymentId() === paymentId &&
        item.getStatus() === WalletReservationStatusEnum.COMMITTED,
    );

    if (!reservation) {
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.reservationNotFound',
      });
    }

    const amount = reservation.getAmount();
    this.credit(amount, false);
    reservation.markReleased();
    this.compactReservations();
    this.touch();
    return amount;
  }

  debit(amount: string, touchVersion = true): void {
    const currentBalance = Number(this.balance);
    const debitAmount = Number(this.normalizeAmount(amount));

    if (currentBalance < debitAmount) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'payments.walletInsufficientBalance',
      });
    }

    this.balance = (currentBalance - debitAmount).toFixed(2);
    if (touchVersion) {
      this.touch();
    }
  }

  credit(amount: string, touchVersion = true): void {
    const currentBalance = Number(this.balance);
    const creditAmount = Number(this.normalizeAmount(amount));
    this.balance = (currentBalance + creditAmount).toFixed(2);
    if (touchVersion) {
      this.touch();
    }
  }

  directRefund(amount: string): void {
    this.credit(amount);
  }

  private findReservationOrThrow(reservationId: string): WalletReservation {
    const reservation = this.reservations.find(
      (item) => item.getId() === reservationId,
    );

    if (!reservation) {
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'payments.reservationNotFound',
      });
    }

    return reservation;
  }

  private compactReservations(): void {
    this.reservations = this.reservations.filter(
      (reservation) =>
        reservation.isHeld() ||
        reservation.getStatus() === WalletReservationStatusEnum.COMMITTED,
    );
  }

  private touch(): void {
    this.version += 1;
    this.updatedAt = new Date();
  }

  private normalizeAmount(amount: string): string {
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'payments.invalidAmount',
      });
    }

    return parsedAmount.toFixed(2);
  }
}
