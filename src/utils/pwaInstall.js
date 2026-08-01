import { getInstallSurface, isAndroidDevice, isIosDevice, isIosSafari } from '@/utils/device'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'

const DISMISS_LOADS_KEY = pwaInstallPolicy.dismissLoadsStorageKey
const SHOW_EVERY_N_LOADS = pwaInstallPolicy.showEveryNLoads

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
}

function onEarlyAppInstalled() {
  earlyDeferredPrompt = null
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

/**
 * آیا الان داخل پوستهٔ نصب‌شده اجرا می‌شویم؟
 * API استاندارد PWA: display-mode + navigator.standalone (iOS)
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
 * API کروم/اج: آیا این webapp از قبل به‌عنوان PWA نصب است؟
 * @see https://web.dev/get-installed-related-apps/
 */
export async function hasInstalledRelatedWebApp() {
  if (!('getInstalledRelatedApps' in navigator)) return false
  try {
    const relatedApps = await navigator.getInstalledRelatedApps()
    if (!Array.isArray(relatedApps)) return false
    return relatedApps.some(
      (app) =>
        app?.platform === 'webapp' ||
        (typeof app?.url === 'string' && app.url.includes('manifest')),
    )
  } catch (_) {
    return false
  }
}

/**
 * تشخیص نصب فقط با API پلتفرم:
 * 1) display-mode standalone (داخل اپ باز شده)
 * 2) getInstalledRelatedApps (کروم/اج/اندروید)
 *
 * beforeinstallprompt جداگانه یعنی «قابل نصب است» — آن را اینجا true برنمی‌گردانیم.
 * فایرفاکس هیچ‌کدام را برای نصب کروم گزارش نمی‌دهد → نباید بنر ساختگی نشان دهیم.
 */
export async function isPwaAlreadyInstalled() {
  if (isStandaloneMode()) return true
  if (await hasInstalledRelatedWebApp()) return true
  return false
}

/** @deprecated — فقط برای سازگاری؛ منبع حقیقت نیست */
export function hasInstalledFlag() {
  return false
}

/** بعد از appinstalled / قبول نصب — فقط شمارندهٔ dismiss را ریست کن */
export function markPwaInstalled() {
  localStorage.removeItem(DISMISS_LOADS_KEY)
}

export function clearPwaInstalledFlag() {
  // عمداً خالی: تشخیص نصب از storage نیست
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
