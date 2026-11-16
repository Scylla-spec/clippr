import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // User prompted when update available
      includeAssets: [
        'icons/icon.svg',
        'icons/favicon-32x32.png',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-512-maskable.png',
      ],
      manifest: {
        name: 'Infinity Barbers',
        short_name: 'Infinity',
        description: 'Installable barbershop queue management and booking system',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#f59e0b',
        background_color: '#10101f',
        lang: 'en',
        categories: ['business', 'productivity', 'lifestyle'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Barber Chair',
            short_name: 'My Chair',
            description: "View today's queue for your chair",
            url: '/barber/dashboard',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // Runtime caching rules
        runtimeCaching: [
          {
            // Google Fonts & Bunny Fonts stylesheets & webfonts
            urlPattern: /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|fonts\.bunny\.net)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'infinity-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Supabase API calls: NetworkFirst to prevent stale or cross-user data leakage
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth)\/v1\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'infinity-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 10, // 10 minutes max for offline fallback
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          supabase: ['@supabase/supabase-js'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          dates: ['date-fns', 'date-fns-tz'],
        },
      },
    },
  },
})
