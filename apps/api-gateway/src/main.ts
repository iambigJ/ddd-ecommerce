import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { globalPipeRules } from '@ddd-ecommerce/shared';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const globalPrefix = configService.get<string>('globalPrefix', 'api');

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(globalPipeRules());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = configService.get<number>('apiPort', 3000);
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

void bootstrap();
