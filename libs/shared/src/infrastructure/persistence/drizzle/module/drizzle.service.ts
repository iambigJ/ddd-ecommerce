import {
  Injectable,
  Inject,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  Global,
} from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import {
  DRIZZLE_MODULE_OPTIONS,
  type DrizzleModuleOptions,
} from './drizzle-config.interface';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';

@Injectable()
@Global()
export class DzService<
  TSchema extends Record<string, unknown> = Record<string, unknown>,
>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DzService.name);
  private pool!: Pool;
  public client!: NodePgDatabase<TSchema>;
  private readonly retryCount: number;
  private readonly retryDelay: number;

  constructor(
    @Inject(DRIZZLE_MODULE_OPTIONS)
    private readonly moduleOptions: DrizzleModuleOptions<TSchema>,
  ) {
    this.retryCount = moduleOptions.retryCount ?? 3;
    this.retryDelay = moduleOptions.retryDelay ?? 2000;
  }

  async onModuleInit() {
    try {
      const poolConfig = this.buildPoolConfig(this.moduleOptions);
      this.pool = new Pool(poolConfig);
      // this.pool.on('error', this.errorHandler.bind(this));

      this.client = drizzle(this.pool, {
        schema: this.moduleOptions.schema,
      });

      await this.connectWithRetry();

      if (this.moduleOptions.doMigrations) {
        const migrationsFolder = this.resolveMigrationsFolder();
        this.logger.log(`Running database migrations from: ${migrationsFolder}`);
        await migrate(this.client, {
          migrationsFolder,
        });
      }
      if (this.moduleOptions.doSeeds && this.moduleOptions.seeds) {
        for (const value of Object.values(this.moduleOptions.seeds)) {
          if (typeof value == 'function') await value(this.client as any);
        }
      }

      this.logger.log('Drizzle service initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to initialize Drizzle service after ${this.retryCount} retry attempts. Error: `,
        {
          error: errorMessage,
          stack: errorStack,
        },
      );

      throw error;
    }
  }

  errorHandler(err: Error) {
    this.logger.error(
      'Unexpected error on idle client',
      err.stack || err.message,
    );
    this.reconnectIfNeeded().catch(() => {});
  }

  private async connectWithRetry(): Promise<void> {
    if (!this.pool || this.pool.ended) {
      throw new Error('Database pool is not initialized or has been closed');
    }

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        await this.checkConnection();

        this.logger.log(
          `Database connection successfully established on attempt ${attempt}`,
        );
        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        if (attempt < this.retryCount) {
          this.logger.warn(
            `Database connection attempt ${attempt}/${this.retryCount} failed. Retrying in ${this.retryDelay}ms...`,
          );
          this.logger.debug(`Connection error`, {
            error: errorMessage,
          });

          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        } else {
          this.logger.error(
            `All ${this.retryCount} connection attempts failed. Last error`,
            {
              error: errorMessage,
            },
          );
        }
      }
    }

    this.logger.error('Failed to establish database connection');
    process.exit(1);
  }

  private async checkConnection(): Promise<void> {
    if (!this.pool || this.pool.ended) {
      throw new Error('Database pool has been closed');
    }

    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  }

  private resolveMigrationsFolder(): string {
    const configuredPath = process.env.DRIZZLE_MIGRATIONS_PATH;
    if (configuredPath) {
      return configuredPath;
    }

    const candidates = [
      path.join(__dirname, 'drizzle', 'migrations')
    ]


    return candidates[0];
  }

  async reconnectIfNeeded(): Promise<void> {
    try {
      if (!this.pool || this.pool.ended) {
        this.logger.error('Database pool has been closed. Cannot reconnect.');
        throw new Error('Database pool has been closed');
      }

      const isConnected = await this.checkConnection()
        .then(() => true)
        .catch(() => false);

      if (isConnected) {
        return;
      }

      this.logger.warn(
        'Database connection lost. Attempting to reconnect using existing pool...',
      );
      await this.connectWithRetry();
      this.logger.log('Database reconnection successful');
    } catch (error) {
      this.logger.error('Failed to reconnect. Exiting app.', error);
      throw error;
    }
  }

  private buildPoolConfig(config: DrizzleModuleOptions): PoolConfig {
    const poolConfig: PoolConfig = {};

    poolConfig.max = config.max ?? 10;
    if (config.idleTimeoutMillis)
      poolConfig.idleTimeoutMillis = config.idleTimeoutMillis;
    if (config.connectionTimeoutMillis)
      poolConfig.connectionTimeoutMillis = config.connectionTimeoutMillis;
    poolConfig.keepAliveInitialDelayMillis =
      config.keepAliveInitialDelayMillis ?? 1000;
    if (config.keepAlive) poolConfig.keepAlive = config.keepAlive;
    if (config.connectionString) {
      poolConfig.connectionString = config.connectionString;
    } else if (
      config.host &&
      config.port &&
      config.database &&
      config.user &&
      config.password
    ) {
      poolConfig.host = config.host;
      poolConfig.port = config.port;
      poolConfig.database = config.database;
      poolConfig.user = config.user;
      poolConfig.password = config.password;
    }

    if (config.ssl !== undefined) {
      poolConfig.ssl = config.ssl;
    }

    return poolConfig;
  }

  getDb(): NodePgDatabase<TSchema> {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
