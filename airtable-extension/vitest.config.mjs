import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.{js,jsx}'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['frontend/lib/**'],
      exclude: ['frontend/lib/data/**'],
      thresholds: {lines: 80, functions: 80, branches: 80, statements: 80},
    },
  },
});
