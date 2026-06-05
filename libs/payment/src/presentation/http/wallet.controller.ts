import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  CurrentUserDec,
  type CurrentUserPayload,
  CustomerAuthGuard,
} from '@ddd-ecommerce/shared';
import { ChargeWalletDto } from '../../application/dto/charge-wallet.dto';
import { ChargeWalletCommand } from '../../application/commands/charge-wallet.command';

@Controller('wallet')
@UseGuards(CustomerAuthGuard)
export class WalletController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('charge')
  //this is mock api only for testing purposes
  charge(@CurrentUserDec() customer: CurrentUserPayload, @Body() input: ChargeWalletDto) {
    return this.commandBus.execute(
      new ChargeWalletCommand(customer.id, input.amount, input.action),
    );
  }
}

