import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from '../../../domain/repositories/product.repository.port';
import { EditProductCommand } from '../edit-product.command';
import { ProductResponse, ProductResponseMapper } from '../../mappers/product-response.mapper';

@CommandHandler(EditProductCommand)
export class EditProductHandler
  implements ICommandHandler<EditProductCommand, ProductResponse>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(EditProductHandler.name);
  }

  async execute(command: EditProductCommand): Promise<ProductResponse> {
    const product = await this.productRepository.findActiveById(command.productId);

    if (!product) {
      this.logger.warn('Edit product failed: product not found', {
        productId: command.productId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'products.notFound',
      });
    }

    product.edit({
      name: command.name,
      price: command.price,
      stock: command.stock,
    });

    return ProductResponseMapper.fromAggregate(
      await this.productRepository.update(product),
    );
  }
}
