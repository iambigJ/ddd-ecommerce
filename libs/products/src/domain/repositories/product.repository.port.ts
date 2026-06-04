import { ProductAggregate } from '../aggregates/product.aggregate';

export const PRODUCT_REPOSITORY = Symbol.for(
  '@ddd-ecommerce/products/PRODUCT_REPOSITORY',
);

export interface ProductRepositoryPort {
  create(product: ProductAggregate): Promise<ProductAggregate>;
  findById(id: string): Promise<ProductAggregate | null>;
  findActiveById(id: string): Promise<ProductAggregate | null>;
  listActive(): Promise<ProductAggregate[]>;
  update(product: ProductAggregate): Promise<ProductAggregate>;
}
