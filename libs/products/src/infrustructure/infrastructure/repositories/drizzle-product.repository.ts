import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DzService } from '@ddd-ecommerce/shared';
import {
  PRODUCT_REPOSITORY,
  ProductRepositoryPort,
} from '../../../domain/repositories/product.repository.port';
import { ProductAggregate } from '../../../domain/aggregates/product.aggregate';
import { products } from '../data-model/products.schema';

@Injectable()
export class DrizzleProductRepository implements ProductRepositoryPort {
  constructor(
    @Inject(DzService)
    private readonly drizzleService: DzService<{ products: typeof products }>,
  ) {}

  async create(product: ProductAggregate): Promise<ProductAggregate> {
    const [createdProduct] = await this.drizzleService
      .getDb()
      .insert(products)
      .values({
        id: product.getId(),
        name: product.getName(),
        price: product.getPrice(),
        stock: product.getStock(),
        isActive: product.getIsActive(),
        createdAt: product.getCreatedAt(),
        updatedAt: product.getUpdatedAt(),
      })
      .returning();

    return this.toAggregate(createdProduct);
  }

  async findById(id: string): Promise<ProductAggregate | null> {
    const [product] = await this.drizzleService
      .getDb()
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return product ? this.toAggregate(product) : null;
  }

  async findActiveById(id: string): Promise<ProductAggregate | null> {
    const [product] = await this.drizzleService
      .getDb()
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .limit(1);

    return product ? this.toAggregate(product) : null;
  }

  async listActive(): Promise<ProductAggregate[]> {
    const rows = await this.drizzleService
      .getDb()
      .select()
      .from(products)
      .where(eq(products.isActive, true));

    return rows.map((product) => this.toAggregate(product));
  }

  async update(product: ProductAggregate): Promise<ProductAggregate> {
    const [updatedProduct] = await this.drizzleService
      .getDb()
      .update(products)
      .set({
        name: product.getName(),
        price: product.getPrice(),
        stock: product.getStock(),
        isActive: product.getIsActive(),
        updatedAt: product.getUpdatedAt(),
      })
      .where(eq(products.id, product.getId()))
      .returning();

    return this.toAggregate(updatedProduct);
  }

  private toAggregate(product: typeof products.$inferSelect): ProductAggregate {
    return ProductAggregate.create({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}

export const ProductRepositoryProvider = {
  provide: PRODUCT_REPOSITORY,
  useClass: DrizzleProductRepository,
};
