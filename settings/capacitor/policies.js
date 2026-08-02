/**
 * سیاست محیط اجرا — web در برابر Capacitor native
 *
 * PWA کامل (نصب/بنر آپدیت) فقط وب.
 * کش آفلاین صفحهٔ لاگین در هر دو محیط فعال است.
 */

/** @typedef {'web' | 'native'} PlatformMode */
/** @typedef {'web' | 'native'} CapabilityProvider */

/**
 * @typedef {Object} PlatformPwaPolicy
 * @property {boolean} loginOfflineCache ثبت SW فقط برای کش پوستهٔ لاگین
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
 * @property {{ provider: CapabilityProvider }} camera
 * @property {{ provider: CapabilityProvider }} location
 * @property {{ provider: CapabilityProvider }} barcode
 * @property {{ provider: CapabilityProvider }} print
 */

/** @type {PlatformPolicy} */
export const webPlatformPolicy = {
  mode: 'web',
  pwa: {
    loginOfflineCache: true,
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
  /** getUserMedia */
  camera: { provider: 'web' },
  /** Geolocation API */
  location: { provider: 'web' },
  /** بارکدخوان — فعلاً در وب غیرفعال */
  barcode: { provider: 'web' },
  print: { provider: 'web' },
}

/** @type {PlatformPolicy} */
export const nativePlatformPolicy = {
  mode: 'native',
  pwa: {
    /** فقط کش لاگین — بدون نصب/بنر آپدیت PWA */
    loginOfflineCache: true,
    earlyInstallCapture: false,
    installBanner: false,
    updateBanner: false,
  },
  sms: { provider: 'native' },
  biometric: { provider: 'native' },
  splash: { provider: 'native', hideHtmlSplash: false },
  /** وضعیت شبکه از ViewApp می‌آید؛ UI آفلاین را خود وب نشان می‌دهد */
  connectivity: { provider: 'native', showWebUi: true },
  /**
   * بک داخل UI وب؛ بک سخت‌افزاری از shell با viewapp:back / ViewAppNav می‌آید.
   */
  navigation: { provider: 'native', showWebBackButton: true },
  /** ViewAppNative / Capacitor Camera / در صورت امکان WebView stream */
  camera: { provider: 'native' },
  /** ViewAppNative.getLocation یا Geolocation داخل WebView */
  location: { provider: 'native' },
  /** بارکدخوان زنده داخل WebView (BarcodeDetector + دوربین) */
  barcode: { provider: 'native' },
  print: { provider: 'native' },
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
    camera: { ...policy.camera },
    location: { ...policy.location },
    barcode: { ...policy.barcode },
    print: { ...policy.print },
  }
}
