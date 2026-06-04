import { PaymentModeEnum, PaymentProviderEnum } from '../enums';

export class PaymentInitiatedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly amount: string,
    public readonly mode: PaymentModeEnum,
    // for now its not used but can consider it 
    public readonly preferredProvider: PaymentProviderEnum | undefined,
    public readonly paymentMethodId: string | undefined,
    public readonly idempotencyKey: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
