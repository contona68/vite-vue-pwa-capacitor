/**
 * اگر اپ native نصب باشد، URL وب در مرورگر اندروید را به اپ هدایت می‌کند.
 * داخل ViewApp/Capacitor یا وقتی کاربر صریحاً در وب مانده، اجرا نمی‌شود.
 */

import { nativeAppOpenSettings } from '@settings/capacitor/nativeAppOpen.js'

const SKIP_KEY = 'viewapp-native-open-skip'
const STAY_PARAM = 'stay'

function isAndroidBrowser() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')
}

function isAlreadyNativeShell() {
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

function shouldSkip() {
  try {
    if (sessionStorage.getItem(SKIP_KEY) === '1') return true
  } catch (_) {
    // ignore
  }

  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get(STAY_PARAM) === '1') {
      markStayInBrowser()
      return true
    }
  } catch (_) {
    // ignore
  }

  return false
}

function buildFallbackUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set(STAY_PARAM, '1')
  return url.toString()
}

function buildIntentUrl(settings) {
  const host = settings.httpsHost
  const path = settings.pathPrefix.endsWith('/')
    ? settings.pathPrefix
    : `${settings.pathPrefix}/`
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
 * @param {typeof nativeAppOpenSettings} [settings]
 * @returns {boolean} true اگر هدایت شروع شد
 */
export function attemptOpenNativeApp(settings = nativeAppOpenSettings) {
  if (!settings?.enabled) return false
  if (typeof window === 'undefined') return false
  if (!isAndroidBrowser()) return false
  if (isAlreadyNativeShell()) return false
  if (shouldSkip()) return false

  const intentUrl = buildIntentUrl(settings)

  try {
    document.documentElement.classList.add('native-app-redirecting')
  } catch (_) {
    // ignore
  }

  // اگر اپ باز نشود، browser_fallback_url با stay=1 صفحه وب را نشان می‌دهد.
  window.location.replace(intentUrl)
  return true
}

export function isNativeAppRedirectPending() {
  try {
    return document.documentElement.classList.contains('native-app-redirecting')
  } catch (_) {
    return false
  }
}
