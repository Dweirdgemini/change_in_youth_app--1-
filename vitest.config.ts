import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration with path aliases matching tsconfig.json
 * Ensures tests can resolve @/ and @shared/ imports correctly
 * AUDIT-0001: Fix import path resolution failures in test environment
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.expo/',
        'tests/',
        '__tests__/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
