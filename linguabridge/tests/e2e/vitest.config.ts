import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 25000,
    hookTimeout: 25000,
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@linguabridge/financial-domain': path.resolve(__dirname, '../../packages/financial-domain/src'),
      '@linguabridge/language-registry': path.resolve(__dirname, '../../packages/language-registry/src'),
      '@linguabridge/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@linguabridge/translation-engine': path.resolve(__dirname, '../../packages/translation-engine/src'),
      '@linguabridge/sdk-js': path.resolve(__dirname, '../../packages/sdk-js/src'),
      '@linguabridge/widget': path.resolve(__dirname, '../../packages/widget/src'),
    },
  },
});
