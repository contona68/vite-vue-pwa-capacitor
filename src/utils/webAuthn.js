/**
 * WebAuthn — فقط برای قفل محلی اثرانگشت (بدون ارسال به سرور)
 */

import { isAndroidDevice, isIosDevice } from '@/utils/device'

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBuffer(base64Url) {
  const padded = String(base64Url).replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (padded.length % 4)) % 4
  const base64 = padded + '='.repeat(padLength)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function getRpId() {
  return window.location.hostname
}

export function isWebAuthnSupported() {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential != null &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  )
}

/**
 * آیا بیومتریک پلتفرم در دسترس است؟
 * وب نوع حسگر (اثرانگشت در برابر چهره) را دقیق نمی‌گوید.
 */
export async function isPlatformBiometricAvailable() {
  if (!isWebAuthnSupported()) return false
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return false
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (_) {
    return false
  }
}

/**
 * آیا این دستگاه برای مسیر «اثرانگشت / بیومتریک» مناسب است؟
 * فقط موبایل (اندروید و iOS) — دسکتاپ خارج است.
 */
export function isFingerprintDeviceCandidate() {
  if (!isWebAuthnSupported()) return false
  return isAndroidDevice() || isIosDevice()
}

/**
 * دستگاه واقعاً برای درخواست اثرانگشت آماده است
 * (کاندید اثرانگشت + بیومتریک پلتفرم در دسترس)
 */
export async function isFingerprintReadyToPrompt() {
  if (!isFingerprintDeviceCandidate()) return false
  return isPlatformBiometricAvailable()
}

export function createRandomChallenge(byteLength = 32) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return bytes.buffer
}

/** ثبت credential پلتفرم؛ فقط id محلی لازم است */
export async function createPlatformCredential({
  challenge,
  userId,
  userName,
  userDisplayName,
}) {
  const publicKey = {
    challenge,
    rp: {
      name: 'هایپریک',
      id: getRpId(),
    },
    user: {
      id: typeof userId === 'string' ? new TextEncoder().encode(userId) : userId,
      name: userName,
      displayName: userDisplayName || userName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'discouraged',
    },
    timeout: 120_000,
    attestation: 'none',
  }

  const credential = await navigator.credentials.create({ publicKey })
  if (!credential) {
    throw new Error('ساخت Passkey لغو شد یا ناموفق بود.')
  }

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
  }
}

/** تأیید اثرانگشت محلی */
export async function getPlatformAssertion({ challenge, allowCredentialIds = [] }) {
  const publicKey = {
    challenge,
    timeout: 120_000,
    userVerification: 'required',
    rpId: getRpId(),
  }

  if (allowCredentialIds.length > 0) {
    publicKey.allowCredentials = allowCredentialIds.map((id) => ({
      type: 'public-key',
      id: typeof id === 'string' ? base64UrlToBuffer(id) : id,
    }))
  }

  const assertion = await navigator.credentials.get({ publicKey })
  if (!assertion) {
    throw new Error('احراز هویت با اثرانگشت لغو شد یا ناموفق بود.')
  }

  return { ok: true, id: assertion.id }
}
