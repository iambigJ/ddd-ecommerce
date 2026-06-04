import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CLogger } from '@ddd-ecommerce/shared';
import { ProductsController } from '../../presentation/http/products.controller';
import { CreateProductHandler } from '../../application/commands/handlers/create-product.handler';
import { EditProductHandler } from '../../application/commands/handlers/edit-product.handler';
import { DeleteProductHandler } from '../../application/commands/handlers/delete-product.handler';
import { GetProductByIdHandler } from '../../application/queries/handlers/get-product-by-id.handler';
import { GetProductForOrderHandler } from '../../application/queries/handlers/get-product-for-order.handler';
import { ListProductsHandler } from '../../application/queries/handlers/list-products.handler';
import {
  DrizzleProductRepository,
  ProductRepositoryProvider,
} from './repositories/drizzle-product.repository';

const commandHandlers = [
  CreateProductHandler,
  EditProductHandler,
  DeleteProductHandler,
];

const queryHandlers = [
  GetProductByIdHandler,
  GetProductForOrderHandler,
  ListProductsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ProductsController],
  providers: [
    DrizzleProductRepository,
    ProductRepositoryProvider,
    CLogger,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [ProductRepositoryProvider],
})
export class ProductsModule {}
