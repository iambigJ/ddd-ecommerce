import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { EditProductDto } from '../../application/dto/edit-product.dto';
import { CreateProductCommand } from '../../application/commands/create-product.command';
import { EditProductCommand } from '../../application/commands/edit-product.command';
import { DeleteProductCommand } from '../../application/commands/delete-product.command';
import { ListProductsQuery } from '../../application/queries/list-products.query';
import { GetProductByIdQuery } from '../../application/queries/get-product-by-id.query';
import { CustomerAuthGuard } from '@ddd-ecommerce/shared';

@Controller('products')
@UseGuards(CustomerAuthGuard)
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@Body() input: CreateProductDto) {
    return this.commandBus.execute(
      new CreateProductCommand(input.name, input.price, input.stock),
    );
  }

  @Get()
  list() {
    return this.queryBus.execute(new ListProductsQuery());
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.queryBus.execute(new GetProductByIdQuery(id));
  }

  @Patch(':id')
  edit(@Param('id') id: string, @Body() input: EditProductDto) {
    return this.commandBus.execute(
      new EditProductCommand(id, input.name, input.price, input.stock),
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteProductCommand(id));
  }
}
