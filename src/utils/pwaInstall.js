import {
  browserLikelySupportsBeforeInstallPrompt,
  getInstallSurface,
  isAndroidDevice,
  isIosDevice,
  isIosSafari,
} from '@/utils/device'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'

const INSTALLED_KEY = pwaInstallPolicy.installedStorageKey
const INSTALLED_COOKIE = pwaInstallPolicy.installedCookieName
const INSTALLED_COOKIE_MAX_AGE = pwaInstallPolicy.installedCookieMaxAgeSec
const DISMISS_LOADS_KEY = pwaInstallPolicy.dismissLoadsStorageKey
const SHOW_EVERY_N_LOADS = pwaInstallPolicy.showEveryNLoads

export {
  browserLikelySupportsBeforeInstallPrompt,
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
  // BIP = این مرورگر هنوز نصب را پیشنهاد می‌دهد (معمولاً نصب نیست / حذف شده)
  if (!isStandaloneMode()) {
    clearPwaInstalledFlag()
  }
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

function cookiePath() {
  const base = import.meta.env.BASE_URL || '/'
  if (!base || base === '/') return '/'
  return base.endsWith('/') ? base : `${base}/`
}

function setInstalledCookie() {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${INSTALLED_COOKIE}=1; Path=${cookiePath()}; Max-Age=${INSTALLED_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

function clearInstalledCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${INSTALLED_COOKIE}=; Path=${cookiePath()}; Max-Age=0; SameSite=Lax`
}

function hasInstalledCookie() {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((part) => part.trim() === `${INSTALLED_COOKIE}=1`)
}

export function markPwaInstalled() {
  localStorage.setItem(INSTALLED_KEY, '1')
  localStorage.removeItem(DISMISS_LOADS_KEY)
  setInstalledCookie()
}

export function clearPwaInstalledFlag() {
  localStorage.removeItem(INSTALLED_KEY)
  clearInstalledCookie()
}

/**
 * نصب قبلی: localStorage (همان مرورگر) یا کوکی (مشترک بین مرورگرها روی همان دامنه).
 * اگر یکی بود، دیگری را همگام کن تا کروم→فایرفاکس هم درست کار کند.
 */
export function hasInstalledFlag() {
  const fromStorage = localStorage.getItem(INSTALLED_KEY) === '1'
  const fromCookie = hasInstalledCookie()

  if (!fromStorage && !fromCookie) return false

  if (fromStorage && !fromCookie) setInstalledCookie()
  if (fromCookie && !fromStorage) localStorage.setItem(INSTALLED_KEY, '1')

  return true
}

/**
 * آیا الان داخل پوستهٔ نصب‌شده (standalone / iOS home screen / …) هستیم؟
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

function relatedAppLooksLikeThisPwa(app) {
  if (!app || typeof app !== 'object') return false
  if (app.platform === 'webapp') return true
  if (typeof app.url === 'string' && app.url.includes('manifest')) return true
  return false
}

/**
 * آیا PWA از قبل نصب است؟
 * ترتیب:
 * 1) standalone
 * 2) فلگ localStorage یا کوکی مشترک بین مرورگرها
 * 3) getInstalledRelatedApps
 */
export async function isPwaAlreadyInstalled() {
  if (isStandaloneMode()) {
    markPwaInstalled()
    return true
  }

  if (hasInstalledFlag()) {
    return true
  }

  if (earlyDeferredPrompt) {
    return false
  }

  if ('getInstalledRelatedApps' in navigator) {
    try {
      const relatedApps = await navigator.getInstalledRelatedApps()
      if (Array.isArray(relatedApps) && relatedApps.some(relatedAppLooksLikeThisPwa)) {
        markPwaInstalled()
        return true
      }
    } catch (_) {
      // پشتیبانی ناقص
    }
  }

  return false
}
