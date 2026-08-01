/**
 * سیاست نمایش بنر نصب و چک آپدیت SW
 *
 * تشخیص نصب از API مرورگر است (BIP / related-apps / standalone)،
 * نه از localStorage به‌عنوان منبع حقیقت.
 */
export const pwaInstallPolicy = {
  dismissLoadsStorageKey: 'pwa-install-loads-since-dismiss',
  /** بعد از dismiss، هر N بار لود دوباره بنر را نشان بده */
  showEveryNLoads: 5,
  /** فاصله چک آپدیت Service Worker (ms) */
  updateCheckIntervalMs: 5 * 60 * 1000,
}
