import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'virtual:pwa-register/react': path.resolve(__dirname, './src/test/__mocks__/pwa-register.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'dist/**',
        'coverage/**',
        'functions/**',
        'src/routeTree.gen.ts',
        'src/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.a11y.test.{ts,tsx}',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 65,
        statements: 65,
        functions: 60,
        branches: 55,
      },
    },
  },
})
