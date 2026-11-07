import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/background.ts', 'src/content.ts', 'src/popup.ts'],
  format: ['iife'],
  outExtension() {
    return {
      js: '.js',
    };
  },
  noExternal: [
    '@linguabridge/shared-types',
    '@linguabridge/sdk-js',
    '@linguabridge/translation-engine',
    '@linguabridge/speech-engine'
  ],
  clean: false,
  splitting: false,
  dts: false,
});
