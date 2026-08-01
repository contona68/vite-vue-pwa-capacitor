/**
 * تشخیص نوع دستگاه — مشترک بین PWA و قفل اثرانگشت
 */

export function isAndroidDevice() {
  return /Android/i.test(window.navigator.userAgent || '')
}

/**
 * iPhone / iPad / iPod
 * نکته: بعضی اندرویدها با «سایت دسکتاپ» خود را MacIntel+touch جا می‌زنند؛
 * برای آن حالت فقط وقتی iOS می‌دانیم که `navigator.standalone` وجود داشته باشد (ویژهٔ iOS).
 */
export function isIosDevice() {
  const ua = window.navigator.userAgent || ''
  if (/Android/i.test(ua)) return false
  if (/iPad|iPhone|iPod/.test(ua)) return true

  const isTouchMac = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
  if (!isTouchMac) return false

  // iPadOS 13+ ؛ اندرویدِ جعلی معمولاً `standalone` ندارد
  return 'standalone' in window.navigator
}

/** Safari واقعی روی iOS (نه Chrome/Firefox داخل WebKit) */
export function isIosSafari() {
  if (!isIosDevice()) return false
  const ua = window.navigator.userAgent || ''
  const isWebkit = /WebKit/i.test(ua)
  const isOtherBrowser = /CriOS|FxiOS|OPiOS|EdgiOS|DuckDuckGo|YaBrowser/i.test(ua)
  return isWebkit && !isOtherBrowser
}

/**
 * سطح نصب PWA — اولویت: اندروید > iOS > دسکتاپ (متنافی‌الاجمع)
 * @returns {'android' | 'ios' | 'desktop'}
 */
export function getInstallSurface() {
  if (isAndroidDevice()) return 'android'
  if (isIosDevice()) return 'ios'
  return 'desktop'
}
