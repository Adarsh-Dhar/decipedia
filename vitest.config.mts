import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: { 'server-only': resolve(import.meta.dirname, 'tests/mocks/server-only.ts') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
