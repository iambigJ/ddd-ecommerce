export const REDIS_IO_OPTIONS = Symbol('REDIS_IO_OPTIONS');
export const REDIS_IO_CLIENT = Symbol('REDIS_IO_CLIENT');

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  commandTimeout?: number;
  connectTimeout?: number;
  reconnectDelay?: number;
  maxConnectionAttempts?: number;
  defaultTtlSec?: number;
  failFast?: boolean;
  useInMemoryFallback?: boolean;
  memoryMaxItems?: number;
  memoryTtlSec?: number;
}
