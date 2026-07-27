import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// برای GitHub Pages: npm run build:gh  (base=/vite-vue-pwa-capacitor/)
// اگر اسم ریپو فرق دارد، در package.json همان را عوض کن
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icons/favicon.ico',
        'icons/favicon-16x16.png',
        'icons/favicon-32x32.png',
        'icons/apple-touch-icon.png',
        'icons/apple-touch-icon-*.png',
        'icons/android-chrome-192x192.png',
        'icons/android-chrome-512x512.png',
        'icons/mstile-150x150.png',
        'icons/msapplication-icon-144x144.png',
        'icons/safari-pinned-tab.svg',
        'icons/browserconfig.xml',
      ],
      manifest: {
        // id و start_url هم‌راستا باشند تا Chrome هویت نصب را اشتباه نگیرد
        id: './',
        name: 'نرم‌افزار حسابداری هایپریک',
        short_name: 'هایپریک',
        description:
          'پیشگام بودن در نوآوری، ارائه خدمات و محصولات با کیفیت، ایجاد رضایتمندی حداکثری در مشتریان',
        lang: 'fa',
        dir: 'rtl',
        theme_color: '#f29220',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        start_url: './',
        prefer_related_applications: false,
        icons: [
          {
            src: 'icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        // دارایی‌های بیلد برای نمایش پوسته ورود لازم‌اند؛ ناوبری آفلاین فقط /login
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,xml}'],
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/\/login\/?$/],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && /\/login\/?$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'login-navigation-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
