import {
  checkLoginByToken,
  openAuthenticatedSession,
  shouldShowAppLockGate,
} from '@/services/session.service'
import { hasPendingLogin, isSessionUnlocked } from '@/utils/auth'
import { isFeatureEnabled } from '@/services/appConfig.service'
import { isBrowserOnline } from '@/utils/network'

/**
 * تصمیم مسیر شروع اپ
 * ترتیب: توکن → (در صورت نیاز قفل اثرانگشت) → خانه
 * @returns {Promise<string>} route name
 */
export async function resolveBootRouteName() {
  if (!isBrowserOnline()) {
    return 'login'
  }

  if (hasPendingLogin()) {
    return isFeatureEnabled('otp') ? 'otp' : 'login'
  }

  // هر بار با توکن چک می‌شود
  const login = await checkLoginByToken()
  if (!login.ok) {
    // توکن نیست یا منقضی → فرم لاگین
    return 'login'
  }

  // توکن معتبر؛ اگر قفل اثرانگشت لازم است و این نشست هنوز آنلاک نشده
  if (shouldShowAppLockGate(login.username) && !isSessionUnlocked()) {
    return 'login'
  }

  openAuthenticatedSession()
  return 'home'
}
