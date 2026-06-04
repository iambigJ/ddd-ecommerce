import {
  DynamicModule,
  Global,
  InjectionToken,
  ModuleMetadata,
  Module,
  Provider,
} from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { RedisConfig } from './redis-configs';
import { CLogger } from '../../logging/logger.service';

export interface RedisIoModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: InjectionToken[];
  useFactory: (...args: unknown[]) => Promise<RedisConfig> | RedisConfig;
}

@Global()
@Module({})
export class RedisIoModule {
  static forRootAsync(options: RedisIoModuleAsyncOptions): DynamicModule {
    const redisConfigProvider: Provider<RedisConfig> = {
      provide: 'REDIS_IO_CONFIG',
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const clientProvider: Provider<Redis> = {
      provide: 'REDIS',
      inject: ['REDIS_IO_CONFIG', CLogger],
      useFactory: async (cfg: RedisConfig, logger: CLogger): Promise<Redis> => {
        const safeConfig = cfg ?? ({} as RedisConfig);
        const reconnectDelay = safeConfig.reconnectDelay ?? 2000;
        const commandTimeout = safeConfig.commandTimeout ?? 2000;
        const connectTimeout = safeConfig.connectTimeout ?? 2000;
        let reconnectAttempts = 0;

        logger.setContext('ioredis');

        const client = new IORedis({
          host: safeConfig.host ?? 'redis',
          port: safeConfig.port ?? 6379,
          password: safeConfig.password,
          keyPrefix: safeConfig.keyPrefix ?? 'app:v1:',
          lazyConnect: cfg.failFast ?? false,
          enableAutoPipelining: false,
          commandTimeout: commandTimeout,
          connectTimeout: connectTimeout,
          enableOfflineQueue: cfg.useInMemoryFallback ?? false,
          retryStrategy: (times: number) => {
            reconnectAttempts = times;
            logger.debug(
              `[redis] retryStrategy called: attempt ${times}, returning delay: ${reconnectDelay}ms`,
            );

            logger.debug(`[redis] Will retry connection in ${reconnectDelay}ms`);
            return reconnectDelay;
          },
        } as RedisOptions);

        let lastReconnectTime: number | null = null;

        client.on('ready', () => {
          logger.log('[redis] Connection ready');
          reconnectAttempts = 0;
          reconnectAttempts = 0;
          lastReconnectTime = null;
        });

        client.on('reconnecting', (delay: number) => {
          const now = Date.now();
          if (lastReconnectTime) {
            const actualDelay = now - lastReconnectTime;
            logger.debug(
              `[redis] Reconnecting... (attempt ${reconnectAttempts + 1}/$})`,
            );
            logger.debug(
              `[redis] Actual delay since last attempt: ${actualDelay}ms, Expected delay: ${reconnectDelay}ms`,
            );
          } else {
            logger.debug(
              `[redis] Reconnecting... (attempt ${reconnectAttempts })`,
            );
          }
          lastReconnectTime = now;
        });

        client.on('end', () => {
          logger.warn('[redis] Connection ended');
        });

        client.on('error', (e: Error) => {
          logger.error('[redis] Connection error:', {
            message: e?.message ?? e,
          });
        });

        try {
          await client.connect();
          return client;
        } catch (error) {
          logger.error(`[redis] Failed to connect `, {
            error: error instanceof Error ? error.message : String(error),
          });
          return client;
        }
      },
    };

    return {
      module: RedisIoModule,
      imports: options.imports ?? [],
      providers: [redisConfigProvider, clientProvider],
      exports: [clientProvider],
    };
  }
}
