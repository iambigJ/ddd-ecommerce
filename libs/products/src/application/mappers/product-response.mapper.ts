import { ProductAggregate } from '../../domain/aggregates/product.aggregate';

export interface ProductResponse {
  id: string;
  name: string;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductResponseMapper {
  static fromAggregate(product: ProductAggregate): ProductResponse {
    return {
      id: product.getId(),
      name: product.getName(),
      price: product.getPrice(),
      stock: product.getStock(),
      isActive: product.getIsActive(),
      createdAt: product.getCreatedAt(),
      updatedAt: product.getUpdatedAt(),
    };
  }
}
