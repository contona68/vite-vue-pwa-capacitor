/**
 * سیاست محیط اجرا — web در برابر Capacitor native
 * native: بدون SW / بنر نصب / آپدیت PWA
 */

/** @typedef {'web' | 'native'} PlatformMode */
/** @typedef {'web' | 'native'} CapabilityProvider */

/**
 * @typedef {Object} PlatformPwaPolicy
 * @property {boolean} runtimeRegistration
 * @property {boolean} earlyInstallCapture
 * @property {boolean} installBanner
 * @property {boolean} updateBanner
 */

/**
 * @typedef {Object} PlatformPolicy
 * @property {PlatformMode} mode
 * @property {PlatformPwaPolicy} pwa
 * @property {{ provider: CapabilityProvider }} sms
 * @property {{ provider: CapabilityProvider }} biometric
 * @property {{ provider: CapabilityProvider, hideHtmlSplash: boolean }} splash
 */

/** @type {PlatformPolicy} */
export const webPlatformPolicy = {
  mode: 'web',
  pwa: {
    runtimeRegistration: true,
    earlyInstallCapture: true,
    installBanner: true,
    updateBanner: true,
  },
  sms: { provider: 'web' },
  biometric: { provider: 'web' },
  splash: { provider: 'web', hideHtmlSplash: false },
}

/** @type {PlatformPolicy} */
export const nativePlatformPolicy = {
  mode: 'native',
  pwa: {
    runtimeRegistration: false,
    earlyInstallCapture: false,
    installBanner: false,
    updateBanner: false,
  },
  sms: { provider: 'native' },
  biometric: { provider: 'native' },
  splash: { provider: 'native', hideHtmlSplash: true },
}

/**
 * @param {boolean} isNative
 * @returns {PlatformPolicy}
 */
export function resolvePlatformPolicy(isNative) {
  return isNative
    ? { ...nativePlatformPolicy, pwa: { ...nativePlatformPolicy.pwa } }
    : { ...webPlatformPolicy, pwa: { ...webPlatformPolicy.pwa } }
}
