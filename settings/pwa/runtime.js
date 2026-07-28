/**
 * کانفیگ ثابت کش آفلاین لاگین در سطح پروژه
 * از تنظیمات کاربر / API تغییر نمی‌کند.
 *
 * این همان Service Worker بیلد است؛ فقط برای پوستهٔ /login
 * (نه بنر نصب و نه آپدیت PWA — آن‌ها از policy محیط می‌آیند).
 */
export const projectPwaConfig = {
  /** ثبت SW برای کش صفحهٔ لاگین (وب و Capacitor) */
  loginOfflineCache: true,
}
