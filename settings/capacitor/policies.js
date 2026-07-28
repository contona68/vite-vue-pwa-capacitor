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
 * @property {{ provider: CapabilityProvider, showWebUi: boolean }} connectivity
 * @property {{ provider: CapabilityProvider, showWebBackButton: boolean }} navigation
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
  /** در وب، اندیکاتور/پیام آفلاین را خود اپ نشان می‌دهد */
  connectivity: { provider: 'web', showWebUi: true },
  /** دکمهٔ بک داخل UI وب */
  navigation: { provider: 'web', showWebBackButton: true },
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
  /** وضعیت شبکه از ViewApp می‌آید؛ overlay آفلاین سمت shell است */
  connectivity: { provider: 'native', showWebUi: false },
  /** بک سخت‌افزاری/ViewApp؛ دکمهٔ داخل وب هم برای تاریخچه فعال است */
  navigation: { provider: 'native', showWebBackButton: true },
}

/**
 * @param {boolean} isNative
 * @returns {PlatformPolicy}
 */
export function resolvePlatformPolicy(isNative) {
  const policy = isNative ? nativePlatformPolicy : webPlatformPolicy
  return {
    ...policy,
    pwa: { ...policy.pwa },
    sms: { ...policy.sms },
    biometric: { ...policy.biometric },
    splash: { ...policy.splash },
    connectivity: { ...policy.connectivity },
    navigation: { ...policy.navigation },
  }
}
