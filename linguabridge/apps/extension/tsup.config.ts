import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/background.ts', 'src/content.ts', 'src/popup.ts'],
  format: ['iife'],
  platform: 'browser',
  target: 'es2022',
  outExtension() {
    return {
      js: '.js',
    };
  },
  noExternal: [
    '@linguabridge/shared-types',
    '@linguabridge/sdk-js',
    '@linguabridge/translation-engine',
    '@linguabridge/speech-engine',
    '@linguabridge/financial-domain',
    '@linguabridge/widget',
  ],
  clean: false,
  splitting: false,
  dts: false,
});
