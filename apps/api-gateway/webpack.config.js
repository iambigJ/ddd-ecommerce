const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      assets: [
        {
          glob: '**/*.json',
          input: join(__dirname, '../../libs/shared/src/assets/i18n'),
          output: 'i18n',
        },
        {
          glob: '**/*',
          input: join(
            __dirname,
            '../../libs/shared/src/infrastructure/persistence/drizzle/migrations',
          ),
          output: 'drizzle/migrations',
        },
      ],
    }),
  ],
};
