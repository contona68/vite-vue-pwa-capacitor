/**
 * تشخیص محیط اجرا — وب / PWA در برابر Capacitor Native
 * بدون وابستگی به Vue یا کامپوننت.
 */

let cachedNative = null
let cachedPlatform = null

function readCapacitor() {
  try {
    // ترجیح: ماژول رسمی؛ در WebView ممکن است window.Capacitor هم باشد
    return window.Capacitor || null
  } catch (_) {
    return null
  }
}

/**
 * آیا داخل اپ native (Capacitor Android/iOS) هستیم؟
 * در مرورگر و PWA نصب‌شده روی Home Screen معمولاً false است.
 */
export function isNativePlatform() {
  if (cachedNative != null) return cachedNative

  try {
    // import همگام از bundle؛ اگر Capacitor در صفحه inject شده باشد
    const Cap = readCapacitor()
    if (Cap && typeof Cap.isNativePlatform === 'function') {
      cachedNative = Boolean(Cap.isNativePlatform())
      return cachedNative
    }
  } catch (_) {
    // ادامه با تشخیص UA ضعیف‌تر
  }

  cachedNative = false
  return cachedNative
}

/** محیط وب (مرورگر یا PWA) */
export function isWebPlatform() {
  return !isNativePlatform()
}

/**
 * نام پلتفرم: 'web' | 'android' | 'ios' | ...
 */
export function getRuntimePlatform() {
  if (cachedPlatform) return cachedPlatform

  try {
    const Cap = readCapacitor()
    if (Cap && typeof Cap.getPlatform === 'function') {
      cachedPlatform = Cap.getPlatform() || 'web'
      return cachedPlatform
    }
  } catch (_) {
    // ignore
  }

  cachedPlatform = 'web'
  return cachedPlatform
}

/** فقط برای تست — ریست کش تشخیص محیط */
export function resetPlatformEnvCache() {
  cachedNative = null
  cachedPlatform = null
}

/**
 * مقداردهی اولیه با ماژول @capacitor/core (دقیق‌تر از window)
 * در bootstrap صدا زده شود.
 */
export async function initPlatformEnv() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    cachedNative = Capacitor.isNativePlatform()
    cachedPlatform = Capacitor.getPlatform()
  } catch (_) {
    cachedNative = false
    cachedPlatform = 'web'
  }

  return {
    isNative: cachedNative,
    platform: cachedPlatform,
  }
}
