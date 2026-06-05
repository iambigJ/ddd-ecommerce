import { PaymentAggregate } from '../aggregates/payment.aggregate';

export const PAYMENT_REPOSITORY = Symbol.for(
  '@ddd-ecommerce/peyment/PAYMENT_REPOSITORY',
);

export interface PaymentRepositoryPort {
  create(payment: PaymentAggregate): Promise<PaymentAggregate>;
  findByIdempotencyKey(idempotencyKey: string): Promise<PaymentAggregate | null>;
  findById(id: string): Promise<PaymentAggregate | null>;
  findByOrderId(orderId: string): Promise<PaymentAggregate | null>;
  findManyByOrderIds(orderIds: string[]): Promise<PaymentAggregate[]>;
  save(payment: PaymentAggregate): Promise<PaymentAggregate>;
}
