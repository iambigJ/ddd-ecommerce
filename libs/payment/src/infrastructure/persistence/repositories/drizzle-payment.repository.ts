import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { DzService, PaymentProviderEnum, PaymentStatusEnum } from '@ddd-ecommerce/shared';
import { orders } from '@ddd-ecommerce/orders/infrastructure/presistence/data-model/order.schema';
import {
  PAYMENT_REPOSITORY,
  PaymentRepositoryPort,
} from '../../../domain/repositories/payment.repository.port';
import {
  PaymentAggregate,
  PaymentAttemptProps,
} from '../../../domain/aggregates/payment.aggregate';
import { paymentAttempts, payments } from '../data-model/payment.schema';

@Injectable()
export class DrizzlePaymentRepository implements PaymentRepositoryPort {
  constructor(
    @Inject(DzService)
    private readonly drizzleService: DzService<{
      payments: typeof payments;
      paymentAttempts: typeof paymentAttempts;
      orders: typeof orders;
    }>,
  ) {}

  async create(payment: PaymentAggregate): Promise<PaymentAggregate> {
    await this.drizzleService
      .getDb()
      .insert(payments)
      .values({
        id: payment.getId(),
        orderId: payment.getOrderId(),
        amount: payment.getAmount(),
        status: payment.getStatus(),
        idempotencyKey: payment.getIdempotencyKey(),
        createdAt: payment.getCreatedAt(),
        updatedAt: payment.getUpdatedAt(),
      });

    return payment;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PaymentAggregate | null> {
    const [payment] = await this.drizzleService
      .getDb()
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey))
      .limit(1);

    return payment ? this.toAggregate(payment) : null;
  }

  async findById(id: string): Promise<PaymentAggregate | null> {
    const [payment] = await this.drizzleService
      .getDb()
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    return payment ? this.toAggregate(payment) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentAggregate | null> {
    const [payment] = await this.drizzleService
      .getDb()
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .limit(1);

    return payment ? this.toAggregate(payment) : null;
  }

  async findManyByCustomerId(customerId: string): Promise<PaymentAggregate[]> {
    const rows = await this.drizzleService
      .getDb()
      .select({ payment: payments })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(payments.createdAt), desc(payments.id));

    return this.toAggregatesBatch(rows.map((row) => row.payment));
  }

  async save(payment: PaymentAggregate): Promise<PaymentAggregate> {
    await this.drizzleService
      .getDb()
      .update(payments)
      .set({
        status: payment.getStatus(),
        updatedAt: payment.getUpdatedAt(),
      })
      .where(eq(payments.id, payment.getId()));

    await this.drizzleService
      .getDb()
      .delete(paymentAttempts)
      .where(eq(paymentAttempts.paymentId, payment.getId()));

    const attempts = payment.getAttempts();
    if (attempts.length > 0) {
      await this.drizzleService
        .getDb()
        .insert(paymentAttempts)
        .values(
          attempts.map((attempt) => ({
            id: attempt.id,
            paymentId: attempt.paymentId,
            provider: attempt.provider,
            amount: attempt.amount,
            status: attempt.status,
            externalTransactionId: attempt.externalTransactionId,
            errorMessage: attempt.errorMessage,
            attemptedAt: attempt.attemptedAt,
          })),
        );
    }

    return payment;
  }

  private async toAggregate(
    payment: typeof payments.$inferSelect,
  ): Promise<PaymentAggregate> {
    const [aggregate] = await this.toAggregatesBatch([payment]);
    return aggregate;
  }

  private async toAggregatesBatch(
    paymentRows: (typeof payments.$inferSelect)[],
  ): Promise<PaymentAggregate[]> {
    if (paymentRows.length === 0) {
      return [];
    }

    const paymentIds = paymentRows.map((payment) => payment.id);
    const attempts = await this.drizzleService
      .getDb()
      .select()
      .from(paymentAttempts)
      .where(inArray(paymentAttempts.paymentId, paymentIds))
      .orderBy(asc(paymentAttempts.attemptedAt));

    const attemptsByPaymentId = new Map<string, (typeof attempts)[number][]>();
    for (const attempt of attempts) {
      const existing = attemptsByPaymentId.get(attempt.paymentId) ?? [];
      existing.push(attempt);
      attemptsByPaymentId.set(attempt.paymentId, existing);
    }

    return paymentRows.map((payment) =>
      this.buildAggregate(payment, attemptsByPaymentId.get(payment.id) ?? []),
    );
  }

  private buildAggregate(
    payment: typeof payments.$inferSelect,
    attempts: (typeof paymentAttempts.$inferSelect)[],
  ): PaymentAggregate {
    return PaymentAggregate.create({
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      status: payment.status as PaymentStatusEnum,
      idempotencyKey: payment.idempotencyKey,
      attempts: attempts.map(
        (attempt): PaymentAttemptProps => ({
          id: attempt.id,
          paymentId: attempt.paymentId,
          provider: attempt.provider as PaymentProviderEnum,
          amount: attempt.amount,
          status: attempt.status as PaymentStatusEnum,
          externalTransactionId: attempt.externalTransactionId ?? undefined,
          errorMessage: attempt.errorMessage ?? undefined,
          attemptedAt: attempt.attemptedAt,
        }),
      ),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });
  }
}

export const PaymentRepositoryProvider = {
  provide: PAYMENT_REPOSITORY,
  useClass: DrizzlePaymentRepository,
};
