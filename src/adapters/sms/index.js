/**
 * نمای یکپارچهٔ SMS/OTP — انتخاب provider بر اساس محیط اجرا
 */

import { isNativePlatform } from '@/platform/env'
import { normalizeOtpCode } from '@/utils/webOtp'
import * as nativeSms from './native'
import * as webSms from './web'

function provider() {
  return isNativePlatform() ? nativeSms : webSms
}

export { normalizeOtpCode }

export function isSmsAutoFillAvailable() {
  return provider().isSmsAutoFillAvailable()
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<string|null>}
 */
export async function listenForSmsOtp(signal) {
  return provider().listenForSmsOtp(signal)
}
