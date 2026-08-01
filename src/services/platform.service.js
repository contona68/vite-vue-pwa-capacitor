/**
 * سرویس سیاست محیط — تنظیمات قابل استفاده مجدد خارج از کامپوننت
 */

import { resolvePlatformPolicy } from '@settings/capacitor/policies.js'
import { getRuntimePlatform, initPlatformEnv, isNativePlatform } from '@/platform/env'

/** @type {import('@settings/capacitor/policies.js').PlatformPolicy | null} */
let activePolicy = null

/**
 * مقداردهی اولیه محیط + سیاست
 */
export async function initPlatformRuntime() {
  const env = await initPlatformEnv()
  activePolicy = resolvePlatformPolicy(env.isNative)

  console.info('[Platform]', {
    isNative: env.isNative,
    platform: env.platform,
    mode: activePolicy.mode,
    sms: activePolicy.sms.provider,
    biometric: activePolicy.biometric.provider,
    connectivity: activePolicy.connectivity,
    navigation: activePolicy.navigation,
    camera: activePolicy.camera,
    location: activePolicy.location,
    barcode: activePolicy.barcode,
    pwa: activePolicy.pwa,
  })

  return {
    env,
    policy: activePolicy,
  }
}

/**
 * @returns {import('@settings/capacitor/policies.js').PlatformPolicy}
 */
export function getPlatformPolicy() {
  if (!activePolicy) {
    activePolicy = resolvePlatformPolicy(isNativePlatform())
  }
  return activePolicy
}

export function getPlatformMode() {
  return getPlatformPolicy().mode
}

/**
 * آیا یک قابلیت PWA در این محیط مجاز است؟
 * @param {'loginOfflineCache' | 'earlyInstallCapture' | 'installBanner' | 'updateBanner'} key
 */
export function isPwaCapabilityEnabled(key) {
  return Boolean(getPlatformPolicy().pwa?.[key])
}

/**
 * اعمال سیاست محیط روی کانفیگ اپ.
 * بنرهای PWA دیگر در features کاربر نیستند؛ فقط از platform.pwa کنترل می‌شوند.
 * @param {ReturnType<import('@settings/app').createDefaultAppConfig>} config
 */
export function applyPlatformPolicyToConfig(config) {
  const policy = getPlatformPolicy()
  const features = { ...(config.features || {}) }

  // پاک‌سازی فلگ‌های قدیمی ذخیره‌شده در localStorage/API
  delete features.installBanner
  delete features.updateBanner

  return {
    ...config,
    features,
    platform: {
      mode: policy.mode,
      runtime: getRuntimePlatform(),
      smsProvider: policy.sms.provider,
      biometricProvider: policy.biometric.provider,
      connectivityProvider: policy.connectivity?.provider,
      navigationProvider: policy.navigation?.provider,
      cameraProvider: policy.camera?.provider,
      locationProvider: policy.location?.provider,
      barcodeProvider: policy.barcode?.provider,
      pwa: { ...policy.pwa },
    },
  }
}
