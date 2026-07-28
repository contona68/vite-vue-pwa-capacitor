/**
 * سیاست نمایش بنر نصب و چک آپدیت SW
 */
export const pwaInstallPolicy = {
  installedStorageKey: 'pwa-app-installed',
  dismissLoadsStorageKey: 'pwa-install-loads-since-dismiss',
  /** بعد از dismiss، هر N بار لود دوباره بنر را نشان بده */
  showEveryNLoads: 5,
  /** تأخیر قبل از نمایش راهنمای نصب دستی (ms) */
  manualGuideDelayMs: 2500,
  /** فاصله چک آپدیت Service Worker (ms) */
  updateCheckIntervalMs: 60 * 60 * 1000,
}
