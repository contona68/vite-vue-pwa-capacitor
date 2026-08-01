/**
 * باز کردن خودکار اپ native وقتی کاربر URL وب را در مرورگر اندروید باز می‌کند.
 */
export const nativeAppOpenSettings = {
  /** فعال بودن هدایت مرورگر → اپ */
  enabled: true,
  /** applicationId اندروید (باید با app-capacitor یکی باشد) */
  androidPackage: 'hyperyek.com',
  /** host همان GitHub Pages / دامنه وب‌اپ */
  httpsHost: 'contona68.github.io',
  /** pathPrefix پروژه روی GitHub Pages */
  pathPrefix: '/vite-vue-pwa-capacitor',
  /** scheme سفارشی پشتیبان */
  customScheme: 'hyperyek',
  customHost: 'app',
}
