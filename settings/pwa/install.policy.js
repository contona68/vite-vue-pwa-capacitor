/**
 * سیاست نمایش بنر نصب و چک آپدیت SW
 */
export const pwaInstallPolicy = {
  installedStorageKey: 'pwa-app-installed',
  /** کوکی هم‌نام — بین مرورگرهای همان دستگاه/دامنه مشترک است (برخلاف localStorage) */
  installedCookieName: 'pwa-app-installed',
  /** عمر کوکی نصب (ثانیه) */
  installedCookieMaxAgeSec: 60 * 60 * 24 * 365 * 2,
  dismissLoadsStorageKey: 'pwa-install-loads-since-dismiss',
  /** بعد از dismiss، هر N بار لود دوباره بنر را نشان بده */
  showEveryNLoads: 5,
  /** تأخیر قبل از نمایش راهنمای نصب دستی (ms) */
  manualGuideDelayMs: 2500,
  /** فاصله چک آپدیت Service Worker (ms) — کوتاه‌تر تا بعد از دپلوی زودتر دیده شود */
  updateCheckIntervalMs: 5 * 60 * 1000,
}
