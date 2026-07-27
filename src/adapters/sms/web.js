/**
 * SMS / OTP — پیاده‌سازی وب (WebOTP API)
 */

import { isWebOtpSupported, waitForSmsOtp } from '@/utils/webOtp'

export function isSmsAutoFillAvailable() {
  return isWebOtpSupported()
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<string|null>}
 */
export async function listenForSmsOtp(signal) {
  return waitForSmsOtp(signal)
}
