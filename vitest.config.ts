import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.property.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
