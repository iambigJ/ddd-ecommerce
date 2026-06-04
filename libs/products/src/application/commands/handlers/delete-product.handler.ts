import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CError, CLogger } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from '../../../domain/repositories/product.repository.port';
import { DeleteProductCommand } from '../delete-product.command';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler
  implements ICommandHandler<DeleteProductCommand, { success: true }>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(DeleteProductHandler.name);
  }

  async execute(command: DeleteProductCommand): Promise<{ success: true }> {
    const product = await this.productRepository.findActiveById(command.productId);

    if (!product) {
      this.logger.warn('Delete product failed: product not found', {
        productId: command.productId,
      });
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'products.notFound',
      });
    }

    product.deactivate();
    await this.productRepository.update(product);

    return { success: true };
  }
}
