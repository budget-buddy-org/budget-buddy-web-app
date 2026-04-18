import fs from 'node:fs';
import path from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
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
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'Budget Buddy',
        short_name: 'Budget Buddy',
        description: 'Smart finance tracker for everyday budgeting',
        id: '/',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        orientation: 'portrait',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Pre-cache the app shell (HTML, CSS, JS, fonts)
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // Don't pre-cache runtime config or version check files
        globIgnores: ['config.json', 'version.json'],
        // Navigation fallback for SPA routing
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/config\.json/, /^\/version\.json/],
        runtimeCaching: [
          {
            // Cache images with a CacheFirst strategy
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
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
          if (!id.includes('node_modules')) return undefined;
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
