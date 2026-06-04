import {
  PaymentProviderEnum,
  PaymentStatusEnum,
} from '@ddd-ecommerce/shared';
import { PaymentAggregate } from '../../domain/aggregates/payment.aggregate';

export interface PaymentAttemptResponse {
  id: string;
  provider: PaymentProviderEnum;
  amount: string;
  status: PaymentStatusEnum;
  externalTransactionId?: string;
  errorMessage?: string;
  attemptedAt: Date;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  amount: string;
  status: PaymentStatusEnum;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  attempts: PaymentAttemptResponse[];
}

export class PaymentResponseMapper {
  static fromAggregate(payment: PaymentAggregate): PaymentResponse {
    return {
      id: payment.getId(),
      orderId: payment.getOrderId(),
      amount: payment.getAmount(),
      status: payment.getStatus(),
      idempotencyKey: payment.getIdempotencyKey(),
      createdAt: payment.getCreatedAt(),
      updatedAt: payment.getUpdatedAt(),
      attempts: payment
        .getAttempts()
        .slice()
        .sort(
          (left, right) =>
            left.attemptedAt.getTime() - right.attemptedAt.getTime(),
        )
        .map((attempt) => ({
          id: attempt.id,
          provider: attempt.provider,
          amount: attempt.amount,
          status: attempt.status,
          externalTransactionId: attempt.externalTransactionId,
          errorMessage: attempt.errorMessage,
          attemptedAt: attempt.attemptedAt,
        })),
    };
  }

  static fromAggregates(payments: PaymentAggregate[]): PaymentResponse[] {
    return payments.map((payment) => this.fromAggregate(payment));
  }
}
