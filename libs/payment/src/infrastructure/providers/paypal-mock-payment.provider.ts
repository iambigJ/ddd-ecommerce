import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateStableHash, PaymentProviderEnum } from '@ddd-ecommerce/shared';
import {
  ExternalPaymentRequest,
  ExternalPaymentResult,
} from '../../application/ports/external-payment.port';
import { IPaymentProviderAdapter } from './payment-provider.interface';

@Injectable()
export class PayPalMockPaymentProvider implements IPaymentProviderAdapter {
  readonly name = PaymentProviderEnum.PAYPAL;
  private readonly forcedFailure: boolean;

  constructor(private readonly configService: ConfigService) {
    this.forcedFailure =
      this.configService.get<string>('payment.paypalForceFailure') === 'true';
  }

  async process(request: ExternalPaymentRequest): Promise<ExternalPaymentResult> {
    if (!request.paymentMethodId?.trim()) {
      return {
        success: false,
        provider: this.name,
        errorMessage: 'payments.paymentMethodRequired',
        isRetryable: false,
      };
    }

    if (this.forcedFailure || this.shouldFail(request.idempotencyKey)) {
      return {
        success: false,
        provider: this.name,
        errorMessage: 'payments.paypalFailed',
        isRetryable: true,
      };
    }

    return {
      success: true,
      provider: this.name,
      externalTransactionId: `paypal_${generateStableHash(request).slice(0, 24)}`,
    };
  }

  private shouldFail(idempotencyKey: string): boolean {
    return idempotencyKey.toLowerCase().includes('paypal_fail');
  }
}
