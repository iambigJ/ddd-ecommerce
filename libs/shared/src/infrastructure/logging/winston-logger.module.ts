import { DynamicModule, Global, Module } from '@nestjs/common';
import { CLogger } from './logger.service';
import { WinstonConfigFactory } from './winston.factory';
import { LoggerConfig } from './logger-config.interface';

@Global()
@Module({})
export class WinstonLoggerModule {
  static forApp(
    appName: string,
    options?: Partial<LoggerConfig>,
  ): DynamicModule {
    const loggerProvider = {
      provide: 'WINSTON_LOGGER',
      useValue: WinstonConfigFactory.createLogger({ appName, ...options }),
    };
    return {
      module: WinstonLoggerModule,
      providers: [loggerProvider, CLogger],
      exports: [loggerProvider, CLogger],
    };
  }
}
