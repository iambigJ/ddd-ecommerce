import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  HeaderResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const fallbackLang =
          configService.get<string>('I18N_FALLBACK_LANGUAGE') ??
          configService.get<string>('I18N_FALLBACK_LANG') ??
          'en';

        const translationsPath =
          configService.get<string>('I18N_TRANSLATIONS_PATH') ??
          join(__dirname, 'i18n');

        return {
          fallbackLanguage: fallbackLang,
          loader: I18nJsonLoader,
          loaderOptions: {
            path: translationsPath,
          },
          resolvers: [
            { use: QueryResolver, options: ['lang'] },
            { use: HeaderResolver, options: ['x-lang'] },
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [I18nModule],
})
export class LocalizationsModule {}
