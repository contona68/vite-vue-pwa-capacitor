/**
 * گزینه‌های VitePWA — فقط در vite.config.js مصرف می‌شود.
 * تغییر نام/آیکون/کش SW از اینجا.
 */
export const vitePwaOptions = {
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
    /**
     * اگر PWA نصب باشد، لینک‌های داخل scope ترجیحاً داخل اپ باز شوند
     * (Chrome/Edge؛ نه Safari/iOS).
     * @see https://developer.chrome.com/docs/capabilities/pwa-navigation-management
     */
    handle_links: 'preferred',
    /**
     * وقتی اپ لانچ می‌شود: پنجرهٔ موجود را بیاور و به همان URL برو
     * (اگر پنجره‌ای نبود، پنجرهٔ جدید).
     */
    launch_handler: {
      client_mode: ['navigate-existing', 'auto'],
    },
    // برای getInstalledRelatedApps روی کروم/اندروید/دسکتاپ
    related_applications: [
      {
        platform: 'webapp',
        url: './manifest.webmanifest',
      },
    ],
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
    // پوستهٔ لاگین آفلاین: دارایی‌های بیلد + ناوبری فقط /login
    // (در وب و Capacitor؛ بنر نصب/آپدیت از policy جداست)
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
}
