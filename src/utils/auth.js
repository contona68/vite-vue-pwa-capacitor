/**
 * نشست و توکن احراز هویت
 *
 * - توکن در localStorage = لاگین پایدار (تا خروج یا انقضا)
 * - آنلاک در sessionStorage = باز بودن قفل اثرانگشت در این اجرای اپ
 * - خروج (logout) = پاک کردن توکن + سیشن + pending
 */

const TOKEN_KEY = 'auth_access_token'
const TOKEN_META_KEY = 'auth_token_meta'
const PENDING_USER_KEY = 'auth_pending_user'
const SESSION_UNLOCKED_KEY = 'auth_session_unlocked'

/** کد دمو OTP */
export const DEMO_OTP_CODE = '123456'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getTokenMeta() {
  try {
    const raw = localStorage.getItem(TOKEN_META_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

export function getTokenUsername() {
  return getTokenMeta()?.username || ''
}

export function hasStoredToken() {
  return Boolean(getAccessToken())
}

export function persistTokenSession({ accessToken, username, expiresAt }) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(
    TOKEN_META_KEY,
    JSON.stringify({
      username,
      expiresAt,
      savedAt: Date.now(),
    }),
  )
  sessionStorage.removeItem(PENDING_USER_KEY)
}

export function clearTokenSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_META_KEY)
}

export function isSessionUnlocked() {
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === '1'
}

export function markSessionUnlocked() {
  sessionStorage.setItem(SESSION_UNLOCKED_KEY, '1')
}

export function clearSessionUnlock() {
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY)
}

/** کاربر لاگین کامل این نشست (توکن + آنلاک) */
export function isLoggedIn() {
  return hasStoredToken() && isSessionUnlocked()
}

export function getCurrentUser() {
  return getTokenUsername() || sessionStorage.getItem(PENDING_USER_KEY) || ''
}

export function hasPendingLogin() {
  return Boolean(sessionStorage.getItem(PENDING_USER_KEY)) && !hasStoredToken()
}

/** بعد از یوزر/پسورد — هنوز OTP */
export function beginPendingLogin(username) {
  sessionStorage.setItem(PENDING_USER_KEY, username)
  clearSessionUnlock()
}

export function getPendingUser() {
  return sessionStorage.getItem(PENDING_USER_KEY) || ''
}

export function clearPendingLogin() {
  sessionStorage.removeItem(PENDING_USER_KEY)
}

export function logout() {
  clearTokenSession()
  clearPendingLogin()
  clearSessionUnlock()
}
