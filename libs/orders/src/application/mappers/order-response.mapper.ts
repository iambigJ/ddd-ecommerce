import { OrderAggregate } from '../../domain/aggregates/order.aggregate';
import { OrderStatusEnum } from '@ddd-ecommerce/shared';

export interface OrderItemResponse {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: string;
}

export interface OrderResponse {
  id: string;
  customerId: string;
  status: OrderStatusEnum;
  totalAmount: string;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export class OrderResponseMapper {
  static fromAggregate(order: OrderAggregate): OrderResponse {
    return {
      id: order.getId(),
      customerId: order.getCustomerId(),
      status: order.getStatus(),
      totalAmount: order.getTotalAmount(),
      items: order.getItems(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    };
  }
}
