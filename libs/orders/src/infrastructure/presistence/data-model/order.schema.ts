
import { pgTable, uuid, decimal, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', [
  'pending', 
  'processing', 
  'paid', 
  'failed'
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_orders_customer').on(table.customerId),
  index('idx_orders_status').on(table.status),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', { precision: 12, scale: 2 }).notNull(),
});
