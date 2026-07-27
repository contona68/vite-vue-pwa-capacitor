import { getInstallSurface, isAndroidDevice, isIosDevice, isIosSafari } from '@/utils/device'

const INSTALLED_KEY = 'pwa-app-installed'
const DISMISS_LOADS_KEY = 'pwa-install-loads-since-dismiss'
const SHOW_EVERY_N_LOADS = 5

export { getInstallSurface, isAndroidDevice, isIosDevice, isIosSafari }

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
  clearPwaInstalledFlag()
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

export function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
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

/**
 * آیا PWA از قبل نصب است؟
 * - standalone / iOS Home Screen → بله
 * - اگر BIP از قبل آمده → قطعاً نصب نیست
 * - فلگ محلی فقط وقتی API related-apps نیست (fallback ضعیف)
 */
export async function isPwaAlreadyInstalled() {
  if (isStandaloneMode()) {
    markPwaInstalled()
    return true
  }

  // BIP یعنی مرورگر هنوز نصب را پیشنهاد می‌دهد
  if (earlyDeferredPrompt) {
    clearPwaInstalledFlag()
    return false
  }

  // iOS در تب مرورگر: فقط راهنما؛ فلگ localStorage گمراه‌کننده است
  if (isIosDevice()) {
    return false
  }

  if ('getInstalledRelatedApps' in navigator) {
    try {
      const relatedApps = await navigator.getInstalledRelatedApps()
      const installed = Array.isArray(relatedApps)
        ? relatedApps.some((app) => app?.platform === 'webapp')
        : false
      if (installed) {
        markPwaInstalled()
        return true
      }
      if (hasInstalledFlag()) {
        clearPwaInstalledFlag()
      }
      return false
    } catch (_) {
      // پشتیبانی ناقص
    }
  }

  return hasInstalledFlag()
}
