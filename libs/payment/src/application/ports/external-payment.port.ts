import { PaymentProviderEnum } from '@ddd-ecommerce/shared';

export const EXTERNAL_PAYMENT_PORT = Symbol.for(
  '@ddd-ecommerce/peyment/EXTERNAL_PAYMENT_PORT',
);

export interface ExternalPaymentRequest {
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: string;
  currency: string;
  idempotencyKey: string;
  paymentMethodId?: string;
}

export interface ExternalPaymentResult {
  success: boolean;
  provider: PaymentProviderEnum;
  externalTransactionId?: string;
  errorMessage?: string;
  isTimeout?: boolean;
  isRetryable?: boolean;
}

export interface ExternalPaymentPort {
  process(
    provider: PaymentProviderEnum,
    request: ExternalPaymentRequest,
  ): Promise<ExternalPaymentResult>;

  getFallbackChain(
    preferredProvider?: PaymentProviderEnum,
  ): PaymentProviderEnum[];
}
