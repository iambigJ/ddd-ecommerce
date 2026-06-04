import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CLogger, GetProductForOrderQuery, ProductForOrderPort } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.port';
import type { ProductRepositoryPort } from '../../../domain/repositories/product.repository.port';

@QueryHandler(GetProductForOrderQuery)
export class GetProductForOrderHandler
  implements IQueryHandler<GetProductForOrderQuery, ProductForOrderPort | null>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetProductForOrderHandler.name);
  }

  async execute(
    query: GetProductForOrderQuery,
  ): Promise<ProductForOrderPort | null> {
    const product = await this.productRepository.findActiveById(query.productId);
    if (!product) return null;

    return {
      id: product.getId(),
      price: product.getPrice(),
      stock: product.getStock(),
    };
  }
}
