import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUserDec,
  type CurrentUserPayload,
  CustomerAuthGuard,
} from '@ddd-ecommerce/shared';
import { RegisterCustomerDto } from '../../application/dto/register-customer.dto';
import { LoginCustomerDto } from '../../application/dto/login-customer.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { EditCustomerDto } from '../../application/dto/edit-customer.dto';
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer.use-case';
import { LoginCustomerUseCase } from '../../application/use-cases/login-customer.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { RefreshCustomerTokenUseCase } from '../../application/use-cases/refresh-customer-token.use-case';
import { EditCustomerUseCase } from '../../application/use-cases/edit-customer.use-case';
import { LogoutCustomerUseCase } from '../../application/use-cases/logout-customer.use-case';
import { LogoutAllCustomerSessionsUseCase } from '../../application/use-cases/logout-all-customer-sessions.use-case';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly registerCustomerUseCase: RegisterCustomerUseCase,
    private readonly loginCustomerUseCase: LoginCustomerUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly refreshCustomerTokenUseCase: RefreshCustomerTokenUseCase,
    private readonly editCustomerUseCase: EditCustomerUseCase,
    private readonly logoutCustomerUseCase: LogoutCustomerUseCase,
    private readonly logoutAllCustomerSessionsUseCase: LogoutAllCustomerSessionsUseCase,
  ) {}

  @Post('register')
  register(@Body() input: RegisterCustomerDto) {
    return this.registerCustomerUseCase.execute(input);
  }

  @Post('login')
  login(@Body() input: LoginCustomerDto) {
    return this.loginCustomerUseCase.execute(input);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  me(@CurrentUserDec() customer: CurrentUserPayload) {
    return this.getMeUseCase.execute(customer.id);
  }

  @Post('refresh')
  refresh(@Body() input: RefreshTokenDto) {
    return this.refreshCustomerTokenUseCase.execute(input);
  }

  @Patch('me')
  @UseGuards(CustomerAuthGuard)
  editMe(
    @CurrentUserDec() customer: CurrentUserPayload,
    @Body() input: EditCustomerDto,
  ) {
    return this.editCustomerUseCase.execute(customer.id, input);
  }

  @Post('logout')
  @UseGuards(CustomerAuthGuard)
  async logout(@CurrentUserDec() customer: CurrentUserPayload) {
    await this.logoutCustomerUseCase.execute(customer.jti);
    return { success: true };
  }

  @Post('logout-all')
  @UseGuards(CustomerAuthGuard)
  async logoutAll(@CurrentUserDec() customer: CurrentUserPayload) {
    await this.logoutAllCustomerSessionsUseCase.execute(customer.id);
    return { success: true };
  }
}
