import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/server.js'],
      thresholds: {lines: 80, functions: 80, branches: 80, statements: 80},
    },
  },
});
