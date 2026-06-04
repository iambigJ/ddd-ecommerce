import { PaymentModeEnum, PaymentProviderEnum } from '@ddd-ecommerce/shared';

export class CheckoutOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly orderId: string,
    public readonly idempotencyKey: string,
    public readonly paymentMode: PaymentModeEnum,
    public readonly preferredProvider?: PaymentProviderEnum,
    public readonly paymentMethodId?: string,
  ) {}
}
