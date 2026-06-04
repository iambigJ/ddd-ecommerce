import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  CError,
  CLogger,
  PaymentInitiatedEvent,
  PaymentModeEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from '@ddd-ecommerce/shared';
import { PaymentAggregate } from '../../domain/aggregates/payment.aggregate';
import {
  EXTERNAL_PAYMENT_PORT,
  type ExternalPaymentPort,
  ExternalPaymentRequest,
  ExternalPaymentResult,
} from '../ports/external-payment.port';
import { WALLET_LEDGER, type WalletLedgerPort } from '../ports/wallet-ledger.port';

@Injectable()
export class ProcessPaymentService {
  private readonly retryCount: number;

  constructor(
    @Inject(WALLET_LEDGER)
    private readonly walletLedger: WalletLedgerPort,
    @Inject(EXTERNAL_PAYMENT_PORT)
    private readonly externalPayment: ExternalPaymentPort,
    private readonly logger: CLogger,
    configService: ConfigService,
  ) {
    this.retryCount = Number(configService.get('payment.retryCount') ?? 1);
    this.logger.setContext(ProcessPaymentService.name);
  }

  async execute(
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
  ): Promise<ExternalPaymentResult> {
    if (event.mode === PaymentModeEnum.WALLET_ONLY) {
      return this.processWalletOnly(payment, event);
    }

    if (event.mode === PaymentModeEnum.PROVIDER_ONLY) {
      return this.processProviderOnly(payment, event);
    }

    return this.processHybrid(payment, event);
  }

  private async processWalletOnly(
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
  ): Promise<ExternalPaymentResult> {
    try {
      await this.walletLedger.directDebit(event.customerId, event.amount);

      payment.addAttempt({
        id: randomUUID(),
        paymentId: payment.getId(),
        provider: PaymentProviderEnum.WALLET,
        amount: event.amount,
        status: PaymentStatusEnum.COMPLETED,
        externalTransactionId: `wallet_${payment.getId()}`,
        attemptedAt: new Date(),
      });
      payment.markCompleted();

      return {
        success: true,
        provider: PaymentProviderEnum.WALLET,
        externalTransactionId: `wallet_${payment.getId()}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof CError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'payments.walletFailed';

      payment.addAttempt({
        id: randomUUID(),
        paymentId: payment.getId(),
        provider: PaymentProviderEnum.WALLET,
        amount: event.amount,
        status: PaymentStatusEnum.FAILED,
        errorMessage,
        attemptedAt: new Date(),
      });
      payment.markFailed();

      return {
        success: false,
        provider: PaymentProviderEnum.WALLET,
        errorMessage,
        isRetryable: false,
      };
    }
  }

  private async processProviderOnly(
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
  ): Promise<ExternalPaymentResult> {
    return this.processExternalFallback(payment, event, event.amount);
  }

  private async processHybrid(
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
  ): Promise<ExternalPaymentResult> {
    const availableBalance = await this.walletLedger.getAvailableBalance(
      event.customerId,
    );
    const walletPortion = Math.min(
      Number(availableBalance),
      Number(event.amount),
    );
    const reservedWalletAmount = walletPortion.toFixed(2);
    let reservationId: string | null = null;

    if (walletPortion > 0) {
      try {
        const reservation = await this.walletLedger.reserve(
          event.customerId,
          payment.getId(),
          event.idempotencyKey,
          reservedWalletAmount,
        );
        reservationId = reservation.getId();

        payment.addAttempt({
          id: randomUUID(),
          paymentId: payment.getId(),
          provider: PaymentProviderEnum.WALLET,
          amount: reservedWalletAmount,
          status: PaymentStatusEnum.PENDING,
          externalTransactionId: `wallet_reserve_${reservationId}`,
          attemptedAt: new Date(),
        });
      } catch (error) {
        const errorMessage =
          error instanceof CError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'payments.walletFailed';

        payment.addAttempt({
          id: randomUUID(),
          paymentId: payment.getId(),
          provider: PaymentProviderEnum.WALLET,
          amount: reservedWalletAmount,
          status: PaymentStatusEnum.FAILED,
          errorMessage,
          attemptedAt: new Date(),
        });
        payment.markFailed();

        return {
          success: false,
          provider: PaymentProviderEnum.WALLET,
          errorMessage,
          isRetryable: false,
        };
      }
    }

    const remainingAmount = Number(event.amount) - walletPortion;

    if (remainingAmount <= 0) {
      if (reservationId) {
        await this.walletLedger.commit(event.customerId, reservationId);
        this.addWalletCommittedAttempt(payment, reservedWalletAmount, reservationId);
      }

      payment.markCompleted();
      return {
        success: true,
        provider: PaymentProviderEnum.WALLET,
        externalTransactionId: reservationId
          ? `wallet_${reservationId}`
          : `wallet_${payment.getId()}`,
      };
    }

    const providerResult = await this.processExternalFallback(
      payment,
      event,
      remainingAmount.toFixed(2),
      false,
    );

    if (providerResult.success) {
      if (reservationId) {
        await this.walletLedger.commit(event.customerId, reservationId);
        this.addWalletCommittedAttempt(payment, reservedWalletAmount, reservationId);
      }

      payment.markCompleted();
      return providerResult;
    }

    if (reservationId) {
      this.logger.warn('Hybrid provider failed, releasing wallet reservation', {
        paymentId: payment.getId(),
        orderId: event.orderId,
        reservationId,
        amount: reservedWalletAmount,
      });
      await this.walletLedger.release(event.customerId, reservationId);

      payment.addAttempt({
        id: randomUUID(),
        paymentId: payment.getId(),
        provider: PaymentProviderEnum.WALLET,
        amount: reservedWalletAmount,
        status: PaymentStatusEnum.REFUNDED,
        externalTransactionId: `wallet_release_${reservationId}`,
        attemptedAt: new Date(),
      });
    }

    payment.markFailed();
    return providerResult;
  }

  private async processExternalFallback(
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
    amount: string,
    markCompleteOnSuccess = true,
  ): Promise<ExternalPaymentResult> {
    let lastResult: ExternalPaymentResult | null = null;

    for (const provider of this.externalPayment.getFallbackChain(
      event.preferredProvider,
    )) {
      for (let attempt = 0; attempt < Math.max(this.retryCount, 1); attempt++) {
        const result = await this.processSingleProvider(
          provider,
          payment,
          event,
          amount,
          markCompleteOnSuccess,
        );
        lastResult = result;

        if (result.success) return result;
        if (!result.isRetryable) break;
      }
    }

    if (markCompleteOnSuccess) {
      payment.markFailed();
    }

    return (
      lastResult ?? {
        success: false,
        provider: event.preferredProvider ?? PaymentProviderEnum.STRIPE,
        errorMessage: 'payments.allProvidersFailed',
        isRetryable: false,
      }
    );
  }

  private async processSingleProvider(
    provider: PaymentProviderEnum,
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
    amount: string,
    markCompleteOnSuccess = true,
  ): Promise<ExternalPaymentResult> {
    const result = await this.safeProcessProvider(provider, payment, event, amount);

    payment.addAttempt({
      id: randomUUID(),
      paymentId: payment.getId(),
      provider: result.provider,
      amount,
      status: result.success
        ? PaymentStatusEnum.COMPLETED
        : PaymentStatusEnum.FAILED,
      externalTransactionId: result.externalTransactionId,
      errorMessage: result.errorMessage,
      attemptedAt: new Date(),
    });

    if (result.success && markCompleteOnSuccess) {
      payment.markCompleted();
    }

    return result;
  }

  private async safeProcessProvider(
    provider: PaymentProviderEnum,
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
    amount: string,
  ): Promise<ExternalPaymentResult> {
    try {
      return await this.externalPayment.process(
        provider,
        this.toExternalPaymentRequest(payment, event, amount),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'payments.providerFailed';

      return {
        success: false,
        provider,
        errorMessage,
        isRetryable: false,
      };
    }
  }

  private addWalletCommittedAttempt(
    payment: PaymentAggregate,
    amount: string,
    reservationId: string,
  ): void {
    payment.addAttempt({
      id: randomUUID(),
      paymentId: payment.getId(),
      provider: PaymentProviderEnum.WALLET,
      amount,
      status: PaymentStatusEnum.COMPLETED,
      externalTransactionId: `wallet_commit_${reservationId}`,
      attemptedAt: new Date(),
    });
  }

  private toExternalPaymentRequest(
    payment: PaymentAggregate,
    event: PaymentInitiatedEvent,
    amount: string,
  ): ExternalPaymentRequest {
    return {
      paymentId: payment.getId(),
      orderId: event.orderId,
      customerId: event.customerId,
      amount,
      currency: 'USD',
      idempotencyKey: event.idempotencyKey,
      paymentMethodId: event.paymentMethodId,
    };
  }
}
