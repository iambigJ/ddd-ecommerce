import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentModeEnum, PaymentProviderEnum } from '@ddd-ecommerce/shared';

export class CheckoutOrderDto {
  @IsString()
  idempotencyKey!: string;

  @IsEnum(PaymentModeEnum)
  paymentMode!: PaymentModeEnum;

  @IsOptional()
  @IsEnum(PaymentProviderEnum)
  preferredProvider?: PaymentProviderEnum;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
