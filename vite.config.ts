import fs from 'node:fs';
import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.8.0'),
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePattern: '\\.test\\.tsx?$',
    }),
    react(),
    tailwindcss(),
    {
      name: 'generate-version-json',
      closeBundle() {
        const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
        const distPath = path.resolve(__dirname, 'dist');
        if (fs.existsSync(distPath)) {
          fs.writeFileSync(
            path.join(distPath, 'version.json'),
            JSON.stringify({ version: pkg.version }, null, 2)
          );
        }
      }
    }
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
