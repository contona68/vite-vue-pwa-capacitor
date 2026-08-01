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
  localStorage.setItem(INSTALLED_KEY, '1')
  localStorage.removeItem(DISMISS_LOADS_KEY)
}

export function clearPwaInstalledFlag() {
  localStorage.removeItem(INSTALLED_KEY)
}

export function hasInstalledFlag() {
  return localStorage.getItem(INSTALLED_KEY) === '1'
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
 * تشخیص نصب — اولویت برای جلوگیری از بنر غلط روی موبایل:
 * 1) standalone
 * 2) getInstalledRelatedApps
 * 3) فلگ localStorage بعد از نصب موفق (appinstalled / قبول BIP)
 *
 * beforeinstallprompt به‌تنهایی معیار «نصب‌نشده» نیست (گاهی بعد از نصب هم می‌آید).
 */
export async function isPwaAlreadyInstalled() {
  if (isStandaloneMode()) {
    markPwaInstalled()
    discardEarlyDeferredPrompt()
    return true
  }

  if (await hasInstalledRelatedWebApp()) {
    markPwaInstalled()
    discardEarlyDeferredPrompt()
    return true
  }

  if (hasInstalledFlag()) {
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
