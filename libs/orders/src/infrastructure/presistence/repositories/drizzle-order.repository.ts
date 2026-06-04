import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DzService, OrderStatusEnum } from '@ddd-ecommerce/shared';
import {
  ORDER_REPOSITORY,
  OrderRepositoryPort,
} from '../../../domain/repositories/order.repository.port';
import { OrderAggregate } from '../../../domain/aggregates/order.aggregate';
import { orderItems, orders } from '../data-model/order.schema';

@Injectable()
export class DrizzleOrderRepository implements OrderRepositoryPort {
  constructor(
    @Inject(DzService)
    private readonly drizzleService: DzService<{
      orders: typeof orders;
      orderItems: typeof orderItems;
    }>,
  ) {}

  async create(order: OrderAggregate): Promise<OrderAggregate> {
    const db = this.drizzleService.getDb();

    await db.insert(orders).values({
      id: order.getId(),
      customerId: order.getCustomerId(),
      status: order.getStatus(),
      totalAmount: order.getTotalAmount(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    });

    const items = order.getItems();
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item) => ({
          id: item.id,
          orderId: order.getId(),
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        })),
      );
    }

    return order;
  }

  async findById(id: string): Promise<OrderAggregate | null> {
    const [order] = await this.drizzleService
      .getDb()
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return null;
    return this.toAggregate(order);
  }

  async findByIdForCustomer(
    id: string,
    customerId: string,
  ): Promise<OrderAggregate | null> {
    const [order] = await this.drizzleService
      .getDb()
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.customerId, customerId)))
      .limit(1);

    if (!order) return null;
    return this.toAggregate(order);
  }

  async listByCustomer(customerId: string): Promise<OrderAggregate[]> {
    const rows = await this.drizzleService
      .getDb()
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId));

    return this.toAggregatesBatch(rows);
  }

  async save(order: OrderAggregate): Promise<OrderAggregate> {
    const db = this.drizzleService.getDb();

    await db
      .update(orders)
      .set({
        status: order.getStatus(),
        totalAmount: order.getTotalAmount(),
        updatedAt: order.getUpdatedAt(),
      })
      .where(eq(orders.id, order.getId()));

    await db.delete(orderItems).where(eq(orderItems.orderId, order.getId()));

    const items = order.getItems();
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item) => ({
          id: item.id,
          orderId: order.getId(),
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        })),
      );
    }

    return order;
  }

  private async toAggregate(
    order: typeof orders.$inferSelect,
  ): Promise<OrderAggregate> {
    const [aggregate] = await this.toAggregatesBatch([order]);
    return aggregate;
  }

  private async toAggregatesBatch(
    orderRows: (typeof orders.$inferSelect)[],
  ): Promise<OrderAggregate[]> {
    if (orderRows.length === 0) {
      return [];
    }

    const orderIds = orderRows.map((order) => order.id);
    const items = await this.drizzleService
      .getDb()
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<string, (typeof items)[number][]>();
    for (const item of items) {
      const existing = itemsByOrderId.get(item.orderId) ?? [];
      existing.push(item);
      itemsByOrderId.set(item.orderId, existing);
    }

    return orderRows.map((order) =>
      this.buildAggregate(order, itemsByOrderId.get(order.id) ?? []),
    );
  }

  private buildAggregate(
    order: typeof orders.$inferSelect,
    items: (typeof orderItems.$inferSelect)[],
  ): OrderAggregate {
    return OrderAggregate.create({
      id: order.id,
      customerId: order.customerId,
      status: order.status as OrderStatusEnum,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }
}

export const OrderRepositoryProvider = {
  provide: ORDER_REPOSITORY,
  useClass: DrizzleOrderRepository,
};
