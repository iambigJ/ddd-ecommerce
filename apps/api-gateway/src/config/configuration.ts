export interface DbConfig {
  postgresUri: string;
  keepAlive: boolean;
  connectionTimeout?: number;
  retryCount?: number;
  doMigrations: boolean
  retryDelay?: number;
}

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
  sessionPrefix?: string;
  customerSessionsPrefix?: string;
}

export interface JwtConfig {
  accessToken: string;
  refreshToken: string;
  accessEx: string;
  refreshEx: string;
}

export interface PaymentConfig {
  retryCount: number;
  retryDelayMs: number;
  providerTimeoutMs: number;
  defaultProvider: string;
  fallbackChain: string;
  stripeForceFailure: string;
  paypalForceFailure: string;
}

export default () => ({
  apiPort: process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3000,
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  jwt: {
    accessToken: process.env.JWT_SECRET_ACCESS_TOKEN,
    refreshToken: process.env.JWT_SECRET_REFRESH_TOKEN,
    accessEx: process.env.JWT_EXPIRE_ACCESS_TOKEN_IN ?? '24h',
    refreshEx: process.env.JWT_EXPIRE_REFRESH_TOKEN_IN ?? '7d',
  } satisfies JwtConfig,
  db: {
    postgresUri: process.env.MAIN_POSTGRES_URI,
    doMigrations: process.env.DO_MIGRATIONS == 'true',
    keepAlive: process.env.PG_POOL_KEEP_ALIVE === 'true',
    connectionTimeout: process.env.PG_CONNECTION_TIMEOUT
      ? parseInt(process.env.PG_CONNECTION_TIMEOUT, 10)
      : undefined,
    retryCount: process.env.PG_RETRY_COUNT
      ? parseInt(process.env.PG_RETRY_COUNT, 10)
      : undefined,
    retryDelay: process.env.PG_RETRY_DELAY
      ? parseInt(process.env.PG_RETRY_DELAY, 10)
      : undefined,
  } satisfies DbConfig,
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'ddd-ecommerce:v1:',
    maxRetriesPerRequest: process.env.REDIS_MAX_RETRIES_PER_REQUEST
      ? parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10)
      : undefined,
    commandTimeout: process.env.REDIS_COMMAND_TIMEOUT
      ? parseInt(process.env.REDIS_COMMAND_TIMEOUT, 10)
      : undefined,
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT
      ? parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10)
      : undefined,
    reconnectDelay: process.env.REDIS_RECONNECT_DELAY
      ? parseInt(process.env.REDIS_RECONNECT_DELAY, 10)
      : undefined,
    maxConnectionAttempts: process.env.REDIS_MAX_CONNECTION_ATTEMPTS
      ? parseInt(process.env.REDIS_MAX_CONNECTION_ATTEMPTS, 10)
      : undefined,
    sessionPrefix: process.env.REDIS_SESSION_PREFIX ?? 'session:',
    customerSessionsPrefix:
      process.env.REDIS_CUSTOMER_SESSIONS_PREFIX ?? 'customer:sessions:',
  } satisfies RedisConfig,
  payment: {
    retryCount: process.env.PAYMENT_RETRY_COUNT
      ? parseInt(process.env.PAYMENT_RETRY_COUNT, 10)
      : 1,
    retryDelayMs: process.env.PAYMENT_RETRY_DELAY_MS
      ? parseInt(process.env.PAYMENT_RETRY_DELAY_MS, 10)
      : 0,
    providerTimeoutMs: process.env.PAYMENT_PROVIDER_TIMEOUT_MS
      ? parseInt(process.env.PAYMENT_PROVIDER_TIMEOUT_MS, 10)
      : 2000,
    defaultProvider: process.env.PAYMENT_DEFAULT_PROVIDER ?? 'stripe',
    fallbackChain: process.env.PAYMENT_FALLBACK_CHAIN ?? 'stripe,paypal',
    stripeForceFailure: process.env.STRIPE_MOCK_FORCE_FAILURE ?? 'false',
    paypalForceFailure: process.env.PAYPAL_MOCK_FORCE_FAILURE ?? 'false',
  } satisfies PaymentConfig,
});
