import { apiIssueToken } from '@/api/authApi'
import {
  clearPendingLogin,
  markSessionUnlocked,
  persistTokenSession,
} from '@/utils/auth'
import { isBrowserOnline } from '@/utils/network'

/** صدور توکن و باز کردن نشست — فقط آنلاین */
export async function completeTokenLogin(username, otpCode = '') {
  if (!isBrowserOnline()) {
    throw new Error('برای ورود به اینترنت نیاز دارید.')
  }

  const tokenResponse = await apiIssueToken({
    username,
    otpCode,
  })

  persistTokenSession({
    accessToken: tokenResponse.accessToken,
    username: tokenResponse.username,
    expiresAt: tokenResponse.expiresAt,
  })
  clearPendingLogin()
  markSessionUnlocked()

  return tokenResponse
}
