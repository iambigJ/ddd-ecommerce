import { IsEnum, IsString } from 'class-validator';
import { WalletChargeActionEnum } from '@ddd-ecommerce/shared';

export class ChargeWalletDto {
  @IsString()
  amount!: string;

  @IsEnum(WalletChargeActionEnum)
  action!: WalletChargeActionEnum;
}

