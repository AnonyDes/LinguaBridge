import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@linguabridge/speech-engine': path.resolve(__dirname, '../speech-engine/src/index.ts'),
      '@linguabridge/financial-domain': path.resolve(__dirname, '../financial-domain/src/index.ts'),
      '@linguabridge/language-registry': path.resolve(__dirname, '../language-registry/src/index.ts'),
      '@linguabridge/translation-engine': path.resolve(__dirname, '../translation-engine/src/index.ts'),
      '@linguabridge/shared-types': path.resolve(__dirname, '../shared-types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    testTimeout: 10000,
  },
});
