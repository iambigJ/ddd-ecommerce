import type { PoolConfig } from 'pg';

export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';
export const DRIZZLE_MODULE_OPTIONS = 'DRIZZLE_MODULE_OPTIONS';
export const PG_POOL = 'PG_POOL';

export interface DrizzleModuleOptions<
  TSchema extends Record<string, any> = Record<string, any>,
> extends PoolConfig {
  retryCount?: number;
  retryDelay?: number;
  schema: TSchema;
  doMigrations: boolean;
  doSeeds: boolean;
  seeds?: Record<string, (db: any) => Promise<void> | void>;
  [key: string]: any;
}
