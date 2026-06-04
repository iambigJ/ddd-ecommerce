import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 
  'completed', 
  'failed', 
  'refunded'
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'wallet', 
  'stripe', 
  'paypal'
]);

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').unique().notNull(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  reservations: jsonb('reservations').default([]).notNull(),
  version: integer('version').default(1).notNull(), // Optimistic locking
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_payments_order').on(table.orderId),
]);

export const paymentAttempts = pgTable('payment_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  provider: paymentProviderEnum('provider').notNull(),
  amount: decimal('amount', { precision: 16, scale: 3 }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  externalTransactionId: varchar('external_transaction_id', { length: 255 }).unique(),
  errorMessage: text('error_message'),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_payment_attempts_payment').on(table.paymentId),
]);
