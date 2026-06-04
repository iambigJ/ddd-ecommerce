import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CLogger } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from '../../../domain/repositories/product.repository.port';
import { ListProductsQuery } from '../list-products.query';
import { ProductResponse, ProductResponseMapper } from '../../mappers/product-response.mapper';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler
  implements IQueryHandler<ListProductsQuery, ProductResponse[]>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(ListProductsHandler.name);
  }

  async execute(): Promise<ProductResponse[]> {
    return (await this.productRepository.listActive()).map((product) =>
      ProductResponseMapper.fromAggregate(product),
    );
  }
}
