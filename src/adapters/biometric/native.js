/**
 * Biometric — native (Capacitor)
 *
 * بدون وابستگی hard به پکیج خاص؛ از Capacitor.Plugins خوانده می‌شود.
 * نام‌های رایج: NativeBiometric, BiometricAuth
 */

import { getCapacitorPlugin } from '@/adapters/bridge'
import { createRandomChallenge as createWebChallenge } from '@/utils/webAuthn'
import { biometricNativeSettings } from '@settings/biometric/native.js'

function resolvePlugin() {
  for (const name of biometricNativeSettings.pluginNames) {
    const plugin = getCapacitorPlugin(name)
    if (plugin) return plugin
  }
  return null
}

export function createRandomChallenge(byteLength = 32) {
  return createWebChallenge(byteLength)
}

export function isWebAuthnSupported() {
  return false
}

export function isFingerprintDeviceCandidate() {
  // در اپ native همیشه کاندید بیومتریک هستیم (پوسته موبایل)
  return true
}

export async function isPlatformBiometricAvailable() {
  const plugin = resolvePlugin()
  if (!plugin) {
    // پلاگین هنوز در shell نصب نشده — برای توسعه false
    console.warn('[Biometric:native] plugin not found on Capacitor.Plugins')
    return false
  }

  try {
    if (typeof plugin.isAvailable === 'function') {
      const result = await plugin.isAvailable()
      return Boolean(result?.isAvailable ?? result?.available ?? result)
    }
    if (typeof plugin.checkBiometry === 'function') {
      const result = await plugin.checkBiometry()
      return Boolean(result?.isAvailable ?? result?.biometryType)
    }
    return true
  } catch (error) {
    console.warn('[Biometric:native] isAvailable failed:', error)
    return false
  }
}

export async function isFingerprintReadyToPrompt() {
  if (!isFingerprintDeviceCandidate()) return false
  return isPlatformBiometricAvailable()
}

/**
 * در native نیازی به credential WebAuthn نیست؛ شناسهٔ ثابت کافی است.
 */
export async function createPlatformCredential({ userName }) {
  if (!(await isFingerprintReadyToPrompt())) {
    throw new Error('بیومتریک روی این دستگاه آماده نیست.')
  }

  return {
    id: `native-biometric:${String(userName || '').toLowerCase()}`,
    rawId: `native-biometric:${String(userName || '').toLowerCase()}`,
  }
}

export async function getPlatformAssertion() {
  const plugin = resolvePlugin()
  if (!plugin) {
    throw new Error('پلاگین بیومتریک Capacitor در دسترس نیست. آن را در پروژهٔ native نصب کنید.')
  }

  const options = { ...biometricNativeSettings.prompt }

  if (typeof plugin.verifyIdentity === 'function') {
    await plugin.verifyIdentity(options)
    return { ok: true, id: 'native-biometric' }
  }

  if (typeof plugin.authenticate === 'function') {
    await plugin.authenticate(options)
    return { ok: true, id: 'native-biometric' }
  }

  throw new Error('متد احراز هویت بیومتریک روی پلاگین یافت نشد.')
}
