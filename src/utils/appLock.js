/**
 * قفل بیومتریک لایه اپ (مثل قفل صفحه)
 *
 * تنظیمات فقط یک پرچم true/false است.
 * ثبت/تأیید اثرانگشت فقط هنگام باز کردن برنامه در صفحه ورود انجام می‌شود.
 *
 * مراحل بررسی ورود با اثرانگشت (ترتیب ثابت):
 * ۱) checkAppLockSettingEnabled
 * ۲) checkAppLockDeviceSupported
 * ۳) checkAppLockBiometricEnrolled
 */

import {
  createPlatformCredential,
  createRandomChallenge,
  getPlatformAssertion,
  isFingerprintDeviceCandidate,
  isFingerprintReadyToPrompt,
  isPlatformBiometricAvailable,
} from '@/adapters/biometric'
import { appLockSettings } from '@settings/biometric/appLock.js'

const LOCK_PREF_KEY = appLockSettings.preferenceStorageKey

function readPref() {
  try {
    const raw = localStorage.getItem(LOCK_PREF_KEY)
    return raw ? JSON.parse(raw) : { enabled: false, username: '', credentialId: '' }
  } catch (_) {
    return { enabled: false, username: '', credentialId: '' }
  }
}

function writePref(pref) {
  localStorage.setItem(LOCK_PREF_KEY, JSON.stringify(pref))
}

/** @deprecated از checkAppLockDeviceSupported استفاده کنید */
export function isAppLockSupported() {
  return checkAppLockDeviceSupported()
}

/** @deprecated از checkAppLockSettingEnabled استفاده کنید */
export function isAppLockEnabled(username = '') {
  return checkAppLockSettingEnabled(username)
}

export function getAppLockUsername() {
  return readPref().username || ''
}

// ─── مرحله ۱: تنظیمات کاربر ───────────────────────────────────────────

/**
 * مرحله ۱ — آیا کاربر در تنظیمات اپ قفل اثرانگشت را فعال کرده؟
 * اگر false باشد مراحل ۲ و ۳ نباید اجرا شوند.
 */
export function checkAppLockSettingEnabled(username = '') {
  const pref = readPref()
  if (!pref.enabled) return false
  if (!username) return true
  if (!pref.username) return true
  return pref.username.toLowerCase() === String(username).trim().toLowerCase()
}

// ─── مرحله ۲: پشتیبانی دستگاه / مرورگر ─────────────────────────────────

/**
 * مرحله ۲ — آیا دستگاه/مرورگر مسیر اثرانگشت را پشتیبانی می‌کند؟
 * فقط موبایل (اندروید یا iOS) + WebAuthn. دسکتاپ false است.
 * اگر false باشد مرحله ۳ نباید اجرا شود.
 */
export function checkAppLockDeviceSupported() {
  return isFingerprintDeviceCandidate()
}

// ─── مرحله ۳: وجود / آمادگی اثرانگشت روی دستگاه ───────────────────────

/**
 * مرحله ۳ — آیا بیومتریک روی دستگاه آماده/ثبت شده است؟
 * فقط وقتی مرحله ۱ و ۲ پاس شده‌اند صدا زده شود.
 */
export async function checkAppLockBiometricEnrolled() {
  return isPlatformBiometricAvailable()
}

// ─── ترکیب مراحل ───────────────────────────────────────────────────────

/**
 * اجرای ترتیبی سه مرحله و تصمیم UI
 * @returns {'none' | 'password' | 'modal' | 'biometric'}
 * - none: مرحله ۱ رد → فقط اعتبارسنجی توکن
 * - password: مرحله ۲ رد → فرم رمز (مرحله ۳ اجرا نشده)
 * - modal: ۱ و ۲ اوکی، ۳ رد
 * - biometric: هر سه اوکی
 */
export async function resolveAppLockEntry(username) {
  if (!checkAppLockSettingEnabled(username)) {
    return 'none'
  }

  if (!checkAppLockDeviceSupported()) {
    return 'password'
  }

  const enrolled = await checkAppLockBiometricEnrolled()
  if (!enrolled) {
    return 'modal'
  }

  return 'biometric'
}

/**
 * ذخیره ترجیح قفل (قابل همگام‌سازی با سرور) — بدون WebAuthn.
 * نمایش/اجرای اثرانگشت در لاگین همچنان به پشتیبانی دستگاه بستگی دارد.
 */
export function enableAppLock(username) {
  const userKey = String(username || '').trim()
  if (!userKey) {
    throw new Error('نام کاربری برای فعال‌سازی قفل لازم است.')
  }

  const prev = readPref()
  writePref({
    enabled: true,
    username: userKey,
    credentialId:
      prev.username.toLowerCase() === userKey.toLowerCase() ? prev.credentialId || '' : '',
    enabledAt: new Date().toISOString(),
  })

  return { ok: true }
}

export function disableAppLock() {
  writePref({ enabled: false, username: '', credentialId: '' })
}

async function ensureLocalCredential(username) {
  if (!(await isFingerprintReadyToPrompt())) {
    throw new Error('اثرانگشت روی این دستگاه آماده نیست.')
  }

  const pref = readPref()
  if (pref.credentialId && pref.username.toLowerCase() === username.toLowerCase()) {
    return pref.credentialId
  }

  const challenge = createRandomChallenge()
  const attestation = await createPlatformCredential({
    challenge,
    userId: `applock:${username.toLowerCase()}`,
    userName: username,
    userDisplayName: username,
  })

  const credentialId = attestation.rawId || attestation.id
  writePref({
    ...pref,
    enabled: true,
    username,
    credentialId,
  })
  return credentialId
}

/**
 * آنلاک محلی با اثرانگشت — فقط روی دستگاه؛ نتیجه به سرور نمی‌رود.
 */
export async function unlockWithBiometric() {
  if (!(await isFingerprintReadyToPrompt())) {
    throw new Error('این دستگاه اثرانگشت آماده ندارد.')
  }

  const pref = readPref()
  if (!pref.enabled) {
    throw new Error('قفل اثرانگشت فعال نیست.')
  }

  const username = pref.username || ''
  if (!username) {
    throw new Error('نام کاربری قفل یافت نشد.')
  }

  if (!pref.credentialId) {
    await ensureLocalCredential(username)
    return { ok: true, username }
  }

  const challenge = createRandomChallenge()
  await getPlatformAssertion({
    challenge,
    allowCredentialIds: [pref.credentialId],
  })

  return { ok: true, username }
}
