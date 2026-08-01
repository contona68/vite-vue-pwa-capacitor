/**
 * باز کردن اپ native از مرورگر اندروید.
 *
 * توجه: Chrome وقتی کاربر URL را در نوار آدرس تایپ کند،
 * هدایت خودکار به intent:// را بلاک می‌کند؛ باید با کلیک کاربر باز شود.
 */

import { nativeAppOpenSettings } from '@settings/capacitor/nativeAppOpen.js'

const SKIP_KEY = 'viewapp-native-open-skip'
const STAY_PARAM = 'stay'

export function isAndroidBrowser() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')
}

export function isAlreadyNativeShell() {
  try {
    if (typeof window === 'undefined') return false
    if (window.__VIEWAPP_NATIVE__) return true
    if (/ViewApp\//i.test(navigator.userAgent || '')) return true
    const Cap = window.Capacitor
    if (Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform()) {
      return true
    }
  } catch (_) {
    // ignore
  }
  return false
}

function markStayInBrowser() {
  try {
    sessionStorage.setItem(SKIP_KEY, '1')
  } catch (_) {
    // ignore
  }
}

export function shouldOfferNativeAppOpen() {
  if (!nativeAppOpenSettings?.enabled) return false
  if (typeof window === 'undefined') return false
  if (!isAndroidBrowser()) return false
  if (isAlreadyNativeShell()) return false

  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get(STAY_PARAM) === '1') {
      markStayInBrowser()
      return false
    }
    if (sessionStorage.getItem(SKIP_KEY) === '1') return false
  } catch (_) {
    // ignore
  }

  return true
}

function buildFallbackUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set(STAY_PARAM, '1')
  return url.toString()
}

export function buildNativeAppIntentUrl(settings = nativeAppOpenSettings) {
  const host = settings.httpsHost
  const pathPrefix = settings.pathPrefix.endsWith('/')
    ? settings.pathPrefix
    : `${settings.pathPrefix}/`
  // مسیر فعلی را حفظ کن (deep link)
  const path = window.location.pathname.startsWith(pathPrefix)
    ? window.location.pathname
    : pathPrefix
  const pathAndQuery = `${path}${window.location.search || ''}${window.location.hash || ''}`
  const fallback = encodeURIComponent(buildFallbackUrl())

  return (
    `intent://${host}${pathAndQuery}#Intent;` +
    'scheme=https;' +
    `package=${settings.androidPackage};` +
    `S.browser_fallback_url=${fallback};` +
    'end'
  )
}

/**
 * باید فقط از رویداد کلیک کاربر صدا زده شود (Chrome بلاک نکند).
 * @returns {boolean}
 */
export function openNativeAppFromUserGesture(settings = nativeAppOpenSettings) {
  if (!isAndroidBrowser() || isAlreadyNativeShell()) return false

  const intentUrl = buildNativeAppIntentUrl(settings)
  window.location.href = intentUrl
  return true
}

/**
 * @returns {Promise<boolean|null>} true نصب است، false نیست، null نامشخص
 */
export async function detectNativeAppInstalled(settings = nativeAppOpenSettings) {
  if (!navigator.getInstalledRelatedApps) return null
  try {
    const apps = await navigator.getInstalledRelatedApps()
    if (!Array.isArray(apps) || !apps.length) return false
    return apps.some(
      (app) =>
        app?.id === settings.androidPackage ||
        (app?.platform === 'play' && app?.id === settings.androidPackage),
    )
  } catch (_) {
    return null
  }
}

/** @deprecated استفاده از بنر + openNativeAppFromUserGesture */
export function attemptOpenNativeApp() {
  return false
}
