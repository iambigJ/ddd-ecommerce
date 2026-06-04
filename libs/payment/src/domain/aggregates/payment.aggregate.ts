import { PaymentProviderEnum, PaymentStatusEnum } from '@ddd-ecommerce/shared';

export interface PaymentAttemptProps {
  id: string;
  paymentId: string;
  provider: PaymentProviderEnum;
  amount: string;
  status: PaymentStatusEnum;
  externalTransactionId?: string;
  errorMessage?: string;
  attemptedAt: Date;
}

export interface PaymentAggregateProps {
  id: string;
  orderId: string;
  amount: string;
  status: PaymentStatusEnum;
  idempotencyKey: string;
  attempts: PaymentAttemptProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentAggregate {
  private readonly id: string;
  private readonly orderId: string;
  private readonly amount: string;
  private status: PaymentStatusEnum;
  private readonly idempotencyKey: string;
  private attempts: PaymentAttemptProps[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: PaymentAggregateProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.amount = Number(props.amount).toFixed(2);
    this.status = props.status;
    this.idempotencyKey = props.idempotencyKey;
    this.attempts = props.attempts;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: PaymentAggregateProps): PaymentAggregate {
    return new PaymentAggregate(props);
  }

  getId(): string {
    return this.id;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getAmount(): string {
    return this.amount;
  }

  getStatus(): PaymentStatusEnum {
    return this.status;
  }

  getIdempotencyKey(): string {
    return this.idempotencyKey;
  }

  getAttempts(): PaymentAttemptProps[] {
    return [...this.attempts];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  addAttempt(attempt: PaymentAttemptProps): void {
    this.attempts.push(attempt);
    this.updatedAt = new Date();
  }

  markCompleted(): void {
    this.status = PaymentStatusEnum.COMPLETED;
    this.updatedAt = new Date();
  }

  markFailed(): void {
    this.status = PaymentStatusEnum.FAILED;
    this.updatedAt = new Date();
  }

  isCompleted(): boolean {
    return this.status === PaymentStatusEnum.COMPLETED;
  }
}
