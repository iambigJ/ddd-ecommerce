import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { CLogger } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from '../../../domain/repositories/product.repository.port';
import { ProductAggregate } from '../../../domain/aggregates/product.aggregate';
import { CreateProductCommand } from '../create-product.command';
import { ProductResponse, ProductResponseMapper } from '../../mappers/product-response.mapper';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  implements ICommandHandler<CreateProductCommand, ProductResponse>
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly logger: CLogger,
  ) {
    this.logger.setContext(CreateProductHandler.name);
  }

  async execute(command: CreateProductCommand): Promise<ProductResponse> {
    const now = new Date();
    const product = ProductAggregate.create({
      id: randomUUID(),
      name: command.name,
      price: command.price,
      stock: command.stock,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return ProductResponseMapper.fromAggregate(
      await this.productRepository.create(product),
    );
  }
}
