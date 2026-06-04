import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './libs/customers/src/infrastructure/persistence/data-model/*.ts',
    './libs/products/src/infrustructure/infrastructure/data-model/*.ts',
    './libs/orders/src/infrastructure/presistence/data-model/*.ts',
    './libs/peyment/src/infrastructure/presistence/data-model/*.ts',
  ],
  out: './libs/shared/src/infrastructure/persistence/drizzle/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.MAIN_POSTGRES_URI ??
      'postgresql://postgres:postgres@localhost:5432/ddd-ecommerce',
  },
});
