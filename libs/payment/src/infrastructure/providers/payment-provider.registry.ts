import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderEnum } from '@ddd-ecommerce/shared';
import {
  ExternalPaymentPort,
  ExternalPaymentRequest,
  ExternalPaymentResult,
} from '../../application/ports/external-payment.port';
import { IPaymentProviderAdapter } from './payment-provider.interface';
import { StripeMockPaymentProvider } from './stripe-mock-payment.provider';
import { PayPalMockPaymentProvider } from './paypal-mock-payment.provider';

@Injectable()
export class PaymentProviderRegistry implements ExternalPaymentPort {
  private readonly providers: Map<PaymentProviderEnum, IPaymentProviderAdapter>;
  private readonly fallbackChain: PaymentProviderEnum[];

  constructor(
    stripeProvider: StripeMockPaymentProvider,
    paypalProvider: PayPalMockPaymentProvider,
    private readonly configService: ConfigService,
  ) {
    this.providers = new Map(
      [stripeProvider, paypalProvider].map((provider) => [provider.name, provider]),
    );
    this.fallbackChain = this.resolveFallbackChain();
  }

  async process(
    provider: PaymentProviderEnum,
    request: ExternalPaymentRequest,
  ): Promise<ExternalPaymentResult> {
    const resolvedProvider = this.providers.get(provider);
    if (!resolvedProvider) {
      throw new Error(`Payment provider is not registered: ${provider}`);
    }
    return resolvedProvider.process(request);
  }

  getFallbackChain(
    preferredProvider?: PaymentProviderEnum,
  ): PaymentProviderEnum[] {
    if (!preferredProvider) {
      return this.fallbackChain;
    }

    return [
      preferredProvider,
      ...this.fallbackChain.filter((provider) => provider !== preferredProvider),
    ];
  }

  private resolveFallbackChain(): PaymentProviderEnum[] {
    const configuredChain =
      this.configService.get<string>('payment.fallbackChain') ??
      'stripe,paypal';

    return configuredChain
      .split(',')
      .map((provider) => provider.trim())
      .filter(
        (provider): provider is PaymentProviderEnum =>
          provider !== PaymentProviderEnum.WALLET &&
          Object.values(PaymentProviderEnum).includes(
            provider as PaymentProviderEnum,
          ),
      );
  }
}
