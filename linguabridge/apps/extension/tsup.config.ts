import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/background.ts', 'src/content.ts', 'src/popup.ts'],
  format: ['esm'],
  noExternal: [
    '@linguabridge/shared-types',
    '@linguabridge/sdk-js',
    '@linguabridge/translation-engine'
  ],
  clean: false,
  splitting: false,
  dts: false,
});
