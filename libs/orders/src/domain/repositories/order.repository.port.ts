import { OrderAggregate } from '../aggregates/order.aggregate';

export const ORDER_REPOSITORY = Symbol.for(
  '@ddd-ecommerce/orders/ORDER_REPOSITORY',
);

export interface OrderRepositoryPort {
  create(order: OrderAggregate): Promise<OrderAggregate>;
  findById(id: string): Promise<OrderAggregate | null>;
  findByIdForCustomer(id: string, customerId: string): Promise<OrderAggregate | null>;
  listByCustomer(customerId: string): Promise<OrderAggregate[]>;
  save(order: OrderAggregate): Promise<OrderAggregate>;
}
