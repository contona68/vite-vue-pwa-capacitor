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
 * @param {'runtimeRegistration' | 'earlyInstallCapture' | 'installBanner' | 'updateBanner'} key
 */
export function isPwaCapabilityEnabled(key) {
  return Boolean(getPlatformPolicy().pwa?.[key])
}

/**
 * اعمال سیاست محیط روی کانفیگ اپ (features و ...)
 * منطق بیزنس/API حفظ می‌شود؛ فقط قابلیت‌های ناسازگار با native خاموش می‌شوند.
 * @param {ReturnType<import('@settings/app').createDefaultAppConfig>} config
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
      connectivityProvider: policy.connectivity?.provider,
      navigationProvider: policy.navigation?.provider,
      pwa: { ...policy.pwa },
    },
  }
}
