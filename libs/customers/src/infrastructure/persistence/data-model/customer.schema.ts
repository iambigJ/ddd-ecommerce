import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const customersTable = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript infer types specifically for database operations
export type CustomerRow = typeof customersTable.$inferSelect;
export type NewCustomerRow = typeof customersTable.$inferInsert;