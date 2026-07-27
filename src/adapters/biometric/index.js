/**
 * نمای یکپارچهٔ Biometric — انتخاب provider بر اساس محیط اجرا
 */

import { isNativePlatform } from '@/platform/env'
import * as nativeBiometric from './native'
import * as webBiometric from './web'

function provider() {
  return isNativePlatform() ? nativeBiometric : webBiometric
}

export function createRandomChallenge(byteLength) {
  return provider().createRandomChallenge(byteLength)
}

export function isWebAuthnSupported() {
  return provider().isWebAuthnSupported()
}

export function isFingerprintDeviceCandidate() {
  return provider().isFingerprintDeviceCandidate()
}

export async function isPlatformBiometricAvailable() {
  return provider().isPlatformBiometricAvailable()
}

export async function isFingerprintReadyToPrompt() {
  return provider().isFingerprintReadyToPrompt()
}

export async function createPlatformCredential(options) {
  return provider().createPlatformCredential(options)
}

export async function getPlatformAssertion(options) {
  return provider().getPlatformAssertion(options)
}
