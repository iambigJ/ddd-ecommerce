import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  API_PORT: Joi.number().port().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  MAIN_POSTGRES_URI: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().uri().optional(),
  PG_POOL_KEEP_ALIVE: Joi.boolean().truthy('true').falsy('false').default(false),
  PG_CONNECTION_TIMEOUT: Joi.number().integer().min(0).optional(),
  PG_RETRY_COUNT: Joi.number().integer().min(1).optional(),
  PG_RETRY_DELAY: Joi.number().integer().min(0).optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().integer().min(0).optional(),
  REDIS_KEY_PREFIX: Joi.string().default('ddd-ecommerce:v1:'),
  REDIS_MAX_RETRIES_PER_REQUEST: Joi.number().integer().min(0).optional(),
  REDIS_COMMAND_TIMEOUT: Joi.number().integer().min(0).optional(),
  REDIS_CONNECT_TIMEOUT: Joi.number().integer().min(0).optional(),
  REDIS_RECONNECT_DELAY: Joi.number().integer().min(0).optional(),
  REDIS_MAX_CONNECTION_ATTEMPTS: Joi.number().integer().min(1).optional(),
  REDIS_SESSION_PREFIX: Joi.string().optional(),
  REDIS_CUSTOMER_SESSIONS_PREFIX: Joi.string().optional(),
  JWT_SECRET_ACCESS_TOKEN: Joi.string().min(32).required(),
  JWT_SECRET_REFRESH_TOKEN: Joi.string().min(32).required(),
  JWT_EXPIRE_ACCESS_TOKEN_IN: Joi.string().default('24h'),
  JWT_EXPIRE_REFRESH_TOKEN_IN: Joi.string().default('7d'),
  PAYMENT_RETRY_COUNT: Joi.number().integer().min(1).default(1),
  PAYMENT_RETRY_DELAY_MS: Joi.number().integer().min(0).default(0),
  PAYMENT_PROVIDER_TIMEOUT_MS: Joi.number().integer().min(0).default(2000),
  PAYMENT_DEFAULT_PROVIDER: Joi.string()
    .valid('wallet', 'stripe', 'paypal')
    .default('stripe'),
  PAYMENT_FALLBACK_CHAIN: Joi.string().default('stripe,paypal'),
  STRIPE_MOCK_FORCE_FAILURE: Joi.string()
    .valid('true', 'false')
    .default('false'),
  PAYPAL_MOCK_FORCE_FAILURE: Joi.string()
    .valid('true', 'false')
    .default('false'),
  I18N_FALLBACK_LANG: Joi.string().default('en'),
});
