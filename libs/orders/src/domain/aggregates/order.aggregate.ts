import { HttpStatus } from '@nestjs/common';
import { CError, OrderStatusEnum } from '@ddd-ecommerce/shared';

export interface OrderItemProps {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
}

export interface OrderAggregateProps {
  id: string;
  customerId: string;
  status: OrderStatusEnum;
  items: OrderItemProps[];
  createdAt: Date;
  updatedAt: Date;
}

export class OrderAggregate {
  private readonly id: string;
  private readonly customerId: string;
  private status: OrderStatusEnum;
  private items: OrderItemProps[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: OrderAggregateProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.status = props.status;
    this.items = props.items.map((item) => this.validateItem(item));
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: OrderAggregateProps): OrderAggregate {
    return new OrderAggregate(props);
  }

  getId(): string {
    return this.id;
  }

  getCustomerId(): string {
    return this.customerId;
  }

  getStatus(): OrderStatusEnum {
    return this.status;
  }

  getItems(): OrderItemProps[] {
    return [...this.items];
  }

  getTotalAmount(): string {
    const total = this.items.reduce(
      (sum, item) => sum + Number(item.priceAtPurchase) * item.quantity,
      0,
    );

    return total.toFixed(2);
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  appendItem(item: OrderItemProps): void {
    this.assertEditable();
    const normalizedItem = this.validateItem(item);
    const existingItem = this.items.find(
      (currentItem) => currentItem.productId === normalizedItem.productId,
    );

    if (existingItem) {
      existingItem.quantity += normalizedItem.quantity;
      existingItem.priceAtPurchase = normalizedItem.priceAtPurchase;
    } else {
      this.items.push(normalizedItem);
    }

    this.updatedAt = new Date();
  }

  removeItem(itemId: string): void {
    this.assertEditable();
    const initialLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== itemId);

    if (this.items.length === initialLength) {
      throw new CError({
        status: HttpStatus.NOT_FOUND,
        message: 'orders.itemNotFound',
      });
    }

    this.updatedAt = new Date();
  }

  markProcessing(): void {
    if (this.status === OrderStatusEnum.PAID) return;
    this.status = OrderStatusEnum.PROCESSING;
    this.updatedAt = new Date();
  }

  markPaid(): void {
    this.status = OrderStatusEnum.PAID;
    this.updatedAt = new Date();
  }

  markFailed(): void {
    if (this.status === OrderStatusEnum.PAID) return;
    this.status = OrderStatusEnum.FAILED;
    this.updatedAt = new Date();
  }

  assertCanCheckout(): void {
    if (this.status == OrderStatusEnum.PROCESSING) {
      throw new CError({
        status: HttpStatus.CONFLICT,
        message: 'orders.alreadyProcessing',
      });
    }
    if (this.status == OrderStatusEnum.PAID) {
      throw new CError({
        status: HttpStatus.CONFLICT,
        message: 'orders.alreadyPaid',
      });
    }

    if (this.items.length === 0) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'orders.emptyItems',
      });
    }
  }

  private assertEditable(): void {
    if (this.status !== OrderStatusEnum.PENDING) {
      throw new CError({
        status: HttpStatus.CONFLICT,
        message: 'orders.notEditable',
      });
    }
  }

  private validateItem(item: OrderItemProps): OrderItemProps {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'orders.invalidQuantity',
      });
    }

    const price = Number(item.priceAtPurchase);
    if (!Number.isFinite(price) || price < 0) {
      throw new CError({
        status: HttpStatus.BAD_REQUEST,
        message: 'orders.invalidPrice',
      });
    }

    return {
      ...item,
      priceAtPurchase: price.toFixed(2),
    };
  }
}
