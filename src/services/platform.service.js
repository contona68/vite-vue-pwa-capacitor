/**
 * سرویس سیاست محیط — تنظیمات قابل استفاده مجدد خارج از کامپوننت
 */

import { resolvePlatformPolicy } from '@/config/platform.defaults'
import { getRuntimePlatform, initPlatformEnv, isNativePlatform } from '@/platform/env'

/** @type {import('@/config/platform.defaults').PlatformPolicy | null} */
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
    pwa: activePolicy.pwa,
  })

  return {
    env,
    policy: activePolicy,
  }
}

/**
 * @returns {import('@/config/platform.defaults').PlatformPolicy}
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
 * @param {'runtimeRegistration' | 'earlyInstallCapture' | 'installBanner' | 'updateBanner'} key
 */
export function isPwaCapabilityEnabled(key) {
  return Boolean(getPlatformPolicy().pwa?.[key])
}

/**
 * اعمال سیاست محیط روی کانفیگ اپ (features و ...)
 * منطق بیزنس/API حفظ می‌شود؛ فقط قابلیت‌های ناسازگار با native خاموش می‌شوند.
 * @param {ReturnType<import('@/config').createDefaultAppConfig>} config
 */
export function applyPlatformPolicyToConfig(config) {
  const policy = getPlatformPolicy()
  const features = { ...(config.features || {}) }

  if (!policy.pwa.installBanner) {
    features.installBanner = false
  }
  if (!policy.pwa.updateBanner) {
    features.updateBanner = false
  }

  return {
    ...config,
    features,
    platform: {
      mode: policy.mode,
      runtime: getRuntimePlatform(),
      smsProvider: policy.sms.provider,
      biometricProvider: policy.biometric.provider,
      pwa: { ...policy.pwa },
    },
  }
}
