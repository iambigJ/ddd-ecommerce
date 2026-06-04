import { HttpStatus } from '@nestjs/common';
import { CError } from '@ddd-ecommerce/shared';

export interface ProductAggregateProps {
  id: string;
  name: string;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductAggregate {
  private readonly id: string;
  private name: string;
  private price: string;
  private stock: number;
  private isActive: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: ProductAggregateProps) {
    this.id = props.id;
    this.name = this.validateName(props.name);
    this.price = this.validatePrice(props.price);
    this.stock = this.validateStock(props.stock);
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: ProductAggregateProps): ProductAggregate {
    return new ProductAggregate(props);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getPrice(): string {
    return this.price;
  }

  getStock(): number {
    return this.stock;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  edit(payload: { name?: string; price?: string; stock?: number }): void {
    const hasName = payload.name !== undefined;
    const hasPrice = payload.price !== undefined;
    const hasStock = payload.stock !== undefined;

    if (!hasName && !hasPrice && !hasStock) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'products.emptyPatch',
      });
    }

    if (hasName) this.name = this.validateName(payload.name ?? '');
    if (hasPrice) this.price = this.validatePrice(payload.price ?? '');
    if (hasStock) this.stock = this.validateStock(payload.stock ?? 0);

    this.updatedAt = new Date();
  }

  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.updatedAt = new Date();
  }

  private validateName(name: string): string {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'products.invalidName',
      });
    }

    return normalizedName;
  }

  private validatePrice(price: string): string {
    const amount = Number(price);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'products.invalidPrice',
      });
    }

    return amount.toFixed(2);
  }

  private validateStock(stock: number): number {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'products.invalidStock',
      });
    }

    return stock;
  }
}
