import { PaymentProviderEnum } from '@ddd-ecommerce/shared';
import {
  ExternalPaymentRequest,
  ExternalPaymentResult,
} from '../../application/ports/external-payment.port';

export interface IPaymentProviderAdapter {
  readonly name: PaymentProviderEnum;
  process(request: ExternalPaymentRequest): Promise<ExternalPaymentResult>;
}
