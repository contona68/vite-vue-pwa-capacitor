/**
 * تشخیص محیط اجرا — وب / PWA در برابر Capacitor Native / ViewApp shell
 * بدون وابستگی به Vue یا کامپوننت.
 */

let cachedNative = null
let cachedPlatform = null

function readWindowCapacitor() {
  try {
    return window.Capacitor || null
  } catch (_) {
    return null
  }
}

function detectViewAppShell() {
  try {
    if (typeof window === 'undefined') return false
    if (window.__VIEWAPP_NATIVE__) return true
    if (/ViewApp\//i.test(navigator.userAgent || '')) return true
    if (typeof window.ViewAppNative?.invoke === 'function') return true
  } catch (_) {
    // ignore
  }
  return false
}

/**
 * آیا داخل اپ native (ViewApp / Capacitor) هستیم؟
 * در مرورگر و PWA نصب‌شده روی Home Screen معمولاً false است.
 */
export function isNativePlatform() {
  if (cachedNative != null) return cachedNative

  if (detectViewAppShell()) {
    cachedNative = true
    return cachedNative
  }

  try {
    const Cap = readWindowCapacitor()
    if (Cap && typeof Cap.isNativePlatform === 'function') {
      cachedNative = Boolean(Cap.isNativePlatform())
      return cachedNative
    }
  } catch (_) {
    // ادامه
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

  if (detectViewAppShell()) {
    cachedPlatform = 'android'
    return cachedPlatform
  }

  try {
    const Cap = readWindowCapacitor()
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
 * مقداردهی اولیه محیط.
 * در ViewApp فلگ shell بر @capacitor/core اولویت دارد
 * (ماژول npm داخل WebView معمولاً false برمی‌گرداند).
 */
export async function initPlatformEnv() {
  if (detectViewAppShell()) {
    cachedNative = true
    cachedPlatform = 'android'
    return {
      isNative: cachedNative,
      platform: cachedPlatform,
    }
  }

  try {
    const { Capacitor } = await import('@capacitor/core')
    cachedNative = Capacitor.isNativePlatform()
    cachedPlatform = Capacitor.getPlatform()
  } catch (_) {
    const Cap = readWindowCapacitor()
    if (Cap && typeof Cap.isNativePlatform === 'function') {
      cachedNative = Boolean(Cap.isNativePlatform())
      cachedPlatform =
        typeof Cap.getPlatform === 'function' ? Cap.getPlatform() || 'web' : 'web'
    } else {
      cachedNative = false
      cachedPlatform = 'web'
    }
  }

  if (!cachedNative && detectViewAppShell()) {
    cachedNative = true
    cachedPlatform = 'android'
  }

  return {
    isNative: cachedNative,
    platform: cachedPlatform,
  }
}
