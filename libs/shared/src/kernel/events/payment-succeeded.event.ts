import { PaymentProviderEnum } from '../enums';

export class PaymentSucceededEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly amount: string,
    public readonly provider: PaymentProviderEnum,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
