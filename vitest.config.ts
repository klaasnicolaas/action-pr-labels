import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'node_modules/**'],
    },
  },
})
