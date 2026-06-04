import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DzService } from './drizzle.service';
import {
  DRIZZLE_MODULE_OPTIONS,
  DrizzleModuleOptions,
} from './drizzle-config.interface';

export interface DrizzleModuleAsyncOptions<
  TSchema extends Record<string, unknown> = Record<string, unknown>,
> {
  useFactory: (
    ...args: any[]
  ) => Promise<DrizzleModuleOptions<TSchema>> | DrizzleModuleOptions<TSchema>;
  inject?: any[];
  imports?: any[];
  schema?: TSchema;
}

@Global()
@Module({})
export class DzModule {
  /**
   * Register with explicit options
   */
  static register<
    TSchema extends Record<string, unknown> = Record<string, unknown>,
  >(options: DrizzleModuleOptions<TSchema>, schema?: TSchema): DynamicModule {
    return {
      module: DzModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: DRIZZLE_MODULE_OPTIONS,
          useValue: {
            ...options,
            schema,
          },
        },
        DzService,
      ],
      exports: [DzService],
    };
  }

  static registerAsync<TSchema extends Record<string, unknown>>(
    options: DrizzleModuleAsyncOptions<TSchema>,
  ): DynamicModule {
    return {
      module: DzModule,
      imports: options.imports || [],
      providers: [
        {
          provide: DRIZZLE_MODULE_OPTIONS,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return {
              ...config,
              schema: options.schema,
            };
          },
          inject: options.inject || [],
        },
        DzService,
      ],
      exports: [DzService],
    };
  }
}
