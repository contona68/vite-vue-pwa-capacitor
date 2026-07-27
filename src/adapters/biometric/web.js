/**
 * Biometric — وب (WebAuthn)
 * لایهٔ نازک روی utils/webAuthn برای یکنواختی قرارداد adapter
 */

export {
  createPlatformCredential,
  createRandomChallenge,
  getPlatformAssertion,
  isFingerprintDeviceCandidate,
  isFingerprintReadyToPrompt,
  isPlatformBiometricAvailable,
  isWebAuthnSupported,
} from '@/utils/webAuthn'
