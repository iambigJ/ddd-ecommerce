import { HttpStatus, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from '../../../domain/repositories/product.repository.port';
import { GetProductByIdQuery } from '../get-product-by-id.query';
import { ProductResponse, ProductResponseMapper } from '../../mappers/product-response.mapper';

@QueryHandler(GetProductByIdQuery)
export class GetProductByIdHandler
  implements IQueryHandler<GetProductByIdQuery, ProductResponse>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(GetProductByIdHandler.name);
  }

  async execute(query: GetProductByIdQuery): Promise<ProductResponse> {
    const product = await this.productRepository.findActiveById(query.productId);

    if (!product) {
      this.logger.warn('Get product failed: product not found', {
        productId: query.productId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'products.notFound',
      });
    }

    return ProductResponseMapper.fromAggregate(product);
  }
}
