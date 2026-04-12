import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.3.0'),
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePattern: '\\.test\\.tsx?$',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('victory-vendor') || id.includes('/d3-')) {
            return 'vendor-recharts'
          }
          if (id.includes('react-dom') || id.includes('react/') || id.includes('/react.')) {
            return 'vendor-react'
          }
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-')) {
            return 'vendor-query'
          }
          if (id.includes('@tanstack/react-router') || id.includes('@tanstack/router-') || id.includes('@tanstack/history')) {
            return 'vendor-router'
          }
          return 'vendor'
        },
      },
    },
  },
});
