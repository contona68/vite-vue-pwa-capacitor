import {
  browserUsesManualInstallGuide,
  getInstallSurface,
  isAndroidDevice,
  isIosDevice,
  isIosSafari,
} from '@/utils/device'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'

const INSTALLED_KEY = pwaInstallPolicy.installedStorageKey
const DISMISS_LOADS_KEY = pwaInstallPolicy.dismissLoadsStorageKey
const SHOW_EVERY_N_LOADS = pwaInstallPolicy.showEveryNLoads

export {
  browserUsesManualInstallGuide,
  getInstallSurface,
  isAndroidDevice,
  isIosDevice,
  isIosSafari,
}

/** رویداد beforeinstallprompt که قبل از mount اپ ممکن است بیاید */
let earlyDeferredPrompt = null
let earlyCaptureBound = false

/**
 * خانوادهٔ مرورگر برای فلگ نصب — تا نصب کروم بنر فایرفاکس را مخفی نکند و برعکس.
 * @returns {'chromium' | 'firefox' | 'safari' | 'ios'}
 */
export function getPwaInstallBrowserFamily() {
  if (isIosDevice()) return 'ios'

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  if (/Firefox|FxiOS/i.test(ua)) return 'firefox'

  if (browserUsesManualInstallGuide()) return 'safari'
  return 'chromium'
}

function getFamilyInstalledKey(family = getPwaInstallBrowserFamily()) {
  return `${INSTALLED_KEY}:${family}`
}

/**
 * باید قبل از هر await در bootstrap صدا زده شود؛
 * روی موبایل BIP اغلب قبل از mount شدن Vue می‌آید و وگرنه از دست می‌رود.
 */
export function startEarlyBeforeInstallPromptCapture() {
  if (typeof window === 'undefined' || earlyCaptureBound) return
  earlyCaptureBound = true

  window.addEventListener('beforeinstallprompt', onEarlyBeforeInstallPrompt)
  window.addEventListener('appinstalled', onEarlyAppInstalled)
}

function onEarlyBeforeInstallPrompt(event) {
  event.preventDefault()
  earlyDeferredPrompt = event
  // عمداً فلگ نصب را پاک نمی‌کنیم:
  // روی موبایل کروم گاهی بعد از نصب هم BIP می‌آید؛ پاک کردن فلگ باعث بنر غلط می‌شود.
}

function onEarlyAppInstalled() {
  earlyDeferredPrompt = null
  markPwaInstalled()
}

/** مصرف رویداد ذخیره‌شده؛ فقط یک‌بار */
export function consumeEarlyDeferredPrompt() {
  const event = earlyDeferredPrompt
  earlyDeferredPrompt = null
  return event
}

export function peekEarlyDeferredPrompt() {
  return earlyDeferredPrompt
}

/** نادیده گرفتن BIP ذخیره‌شده وقتی مطمئنیم نصب است */
export function discardEarlyDeferredPrompt() {
  earlyDeferredPrompt = null
}

export function markPwaInstalled() {
  const family = getPwaInstallBrowserFamily()
  localStorage.setItem(getFamilyInstalledKey(family), '1')

  // کلید قدیمی فقط برای کرومیوم — سازگاری با جلسات قبلی
  if (family === 'chromium') {
    localStorage.setItem(INSTALLED_KEY, '1')
  }

  localStorage.removeItem(DISMISS_LOADS_KEY)
}

export function clearPwaInstalledFlag() {
  const family = getPwaInstallBrowserFamily()
  localStorage.removeItem(getFamilyInstalledKey(family))
  if (family === 'chromium') {
    localStorage.removeItem(INSTALLED_KEY)
  }
}

export function hasInstalledFlag() {
  const family = getPwaInstallBrowserFamily()
  if (localStorage.getItem(getFamilyInstalledKey(family)) === '1') return true

  // فقط کرومیوم کلید بدون پسوند قدیمی را می‌خواند (نصب کروم ≠ نصب فایرفاکس)
  if (family === 'chromium' && localStorage.getItem(INSTALLED_KEY) === '1') return true

  return false
}

/**
 * آیا الان داخل پوستهٔ نصب‌شده اجرا می‌شویم؟
 */
export function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * API کروم: آیا این webapp نصب است؟
 */
export async function hasInstalledRelatedWebApp() {
  if (!('getInstalledRelatedApps' in navigator)) return false
  try {
    const relatedApps = await navigator.getInstalledRelatedApps()
    if (!Array.isArray(relatedApps) || relatedApps.length === 0) return false
    return relatedApps.some(
      (app) =>
        app?.platform === 'webapp' ||
        app?.platform === 'play' ||
        (typeof app?.url === 'string' && app.url.length > 0),
    )
  } catch (_) {
    return false
  }
}

/**
 * تشخیص نصب:
 * 1) standalone → نصب است + فلگ همان خانواده مرورگر
 * 2) فلگ همان خانواده (firefox/ios/safari/chromium جدا)
 * 3) فقط کرومیوم: getInstalledRelatedApps
 *
 * نکته: فلگ کروم بنر فایرفاکس را مخفی نمی‌کند و برعکس.
 */
export async function isPwaAlreadyInstalled() {
  if (isStandaloneMode()) {
    markPwaInstalled()
    discardEarlyDeferredPrompt()
    return true
  }

  if (hasInstalledFlag()) {
    discardEarlyDeferredPrompt()
    return true
  }

  // related-apps فقط برای کرومیوم معنی دارد
  if (browserUsesManualInstallGuide()) {
    return false
  }

  if (await hasInstalledRelatedWebApp()) {
    markPwaInstalled()
    discardEarlyDeferredPrompt()
    return true
  }

  return false
}

export function getLoadsSinceDismiss() {
  const raw = localStorage.getItem(DISMISS_LOADS_KEY)
  if (raw === null) return null
  const value = Number(raw)
  return Number.isNaN(value) ? 0 : value
}

export function setLoadsSinceDismiss(value) {
  localStorage.setItem(DISMISS_LOADS_KEY, String(value))
}

export function shouldHideByDismissPolicy() {
  const loads = getLoadsSinceDismiss()
  if (loads === null) return false
  return loads < SHOW_EVERY_N_LOADS
}

export function incrementDismissLoadCount() {
  const loads = getLoadsSinceDismiss()
  if (loads === null) return
  setLoadsSinceDismiss(loads + 1)
}
