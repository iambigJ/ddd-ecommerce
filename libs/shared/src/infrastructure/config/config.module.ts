import {
  ConfigFactory,
  ConfigModule as NestConfigModule,
} from '@nestjs/config';
import Joi, { Schema } from 'joi';

export interface ConfigOptions {
  validationSchema?: Schema;
  load?: (() => Record<string, any>)[];
  isGlobal?: boolean;
  cache?: boolean;
  envFilePath?: string | string[];
}

export function createConfigModule(
  load: ConfigFactory,
  validationSchema?: Joi.Schema,
) {
  return NestConfigModule.forRoot({
    isGlobal: true,
    cache: true,
    validationSchema,
    load: [load],
  });
}
