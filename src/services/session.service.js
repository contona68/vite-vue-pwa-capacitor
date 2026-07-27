/**
 * نشست لاگین مبتنی بر توکن
 * توکن = وضعیت لاگین پایدار؛ اثرانگشت فقط قفل محلی است (نه لاگین).
 */

import { apiValidateToken } from '@/api/authApi'
import {
  checkAppLockDeviceSupported,
  checkAppLockSettingEnabled,
} from '@/utils/appLock'
import { isFeatureEnabled } from '@/services/appConfig.service'
import {
  clearPendingLogin,
  clearSessionUnlock,
  clearTokenSession,
  getAccessToken,
  getTokenUsername,
  logout,
  markSessionUnlocked,
} from '@/utils/auth'

/**
 * چک لاگین با توکن ذخیره‌شده.
 * منقضی/نامعتبر → پاک کردن توکن و سیشن (مثل خروج).
 */
export async function checkLoginByToken() {
  const token = getAccessToken()
  if (!token) {
    return { ok: false, reason: 'missing', token: '' }
  }

  const result = await apiValidateToken(token)
  if (!result.ok) {
    clearTokenSession()
    clearSessionUnlock()
    clearPendingLogin()
    return { ok: false, reason: result.reason || 'invalid', token: '' }
  }

  return {
    ok: true,
    reason: 'valid',
    token,
    username: result.username || getTokenUsername(),
  }
}

/**
 * آیا بعد از توکن معتبر باید قفل اثرانگشت نشان داده شود؟
 * (تنظیمات روشن + دستگاه موبایل مناسب)
 */
export function shouldShowAppLockGate(username = getTokenUsername()) {
  if (!isFeatureEnabled('appLock')) return false
  if (!checkAppLockSettingEnabled(username)) return false
  if (!checkAppLockDeviceSupported()) return false
  return true
}

/** ورود به خانه بعد از توکن معتبر (و در صورت نیاز بعد از آنلاک) */
export function openAuthenticatedSession() {
  markSessionUnlocked()
}

/** خروج کامل: توکن + سیشن + pending */
export function performLogout() {
  logout()
}
