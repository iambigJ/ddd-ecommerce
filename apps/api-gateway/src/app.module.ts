import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import {
  DzModule,
  type DrizzleModuleOptions,
  EnvelopeInterceptor,
  GlobalExceptionFilter,
  HealthModule,
  JwtGlobalModule,
  LocalizationsModule,
  LoggerInterceptor,
  RedisIoModule,
  WinstonLoggerModule,
} from '@ddd-ecommerce/shared';
import { DddEcommerceCustomersModule } from '@ddd-ecommerce/customers';
import { DddEcommerceOrdersModule } from '@ddd-ecommerce/orders';
import { DddEcommercePaymentModule } from '@ddd-ecommerce/payment';
import { DddEcommerceProductsModule } from '@ddd-ecommerce/products';
import configuration, { DbConfig, RedisConfig } from './config/configuration';
import { configValidationSchema } from './config/config.validation';
import { schema } from './schema';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidationSchema,
    }),
    CqrsModule,
    LocalizationsModule,
    JwtGlobalModule,
    WinstonLoggerModule.forApp('main'),
    DzModule.registerAsync({
      useFactory: (configService: ConfigService): DrizzleModuleOptions<typeof schema> => {
        const dbConfig = configService.get<DbConfig>('db');
        return {
          doSeeds: false,
          doMigrations: configService.getOrThrow("db.doMigrations", true),
          connectionString: configService.getOrThrow<string>('db.postgresUri'),
          connectionTimeoutMillis: dbConfig?.connectionTimeout,
          keepAlive: dbConfig?.keepAlive,
          retryCount: dbConfig?.retryCount,
          retryDelay: dbConfig?.retryDelay,
          schema,
        };
      },
      inject: [ConfigService],
      schema,
    }),
    RedisIoModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RedisConfig => {
        const redisConfig = configService.get<RedisConfig>('redis');
        return {
          host: redisConfig?.host ?? 'localhost',
          port: redisConfig?.port ?? 6379,
          password: redisConfig?.password,
          keyPrefix: redisConfig?.keyPrefix ?? 'app:v1:',
          maxRetriesPerRequest: redisConfig?.maxRetriesPerRequest ?? 3,
          commandTimeout: redisConfig?.commandTimeout ?? 2000,
          connectTimeout: redisConfig?.connectTimeout ?? 2000,
          reconnectDelay: redisConfig?.reconnectDelay ?? 1000,
          maxConnectionAttempts: redisConfig?.maxConnectionAttempts ?? 4,
        };
      },
    }),
    HealthModule,
    DddEcommerceCustomersModule,
    DddEcommerceProductsModule,
    DddEcommerceOrdersModule,
    DddEcommercePaymentModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
