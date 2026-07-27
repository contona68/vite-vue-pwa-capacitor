/**
 * نمای یکپارچهٔ Splash — انتخاب provider بر اساس محیط اجرا
 */

import { isNativePlatform } from '@/platform/env'
import * as nativeSplash from './native'
import * as webSplash from './web'

function provider() {
  return isNativePlatform() ? nativeSplash : webSplash
}

export function prepareSplash() {
  return provider().prepareSplash()
}

export async function hideSplash() {
  return provider().hideSplash()
}

export function shouldUseHtmlSplash() {
  return provider().shouldUseHtmlSplash()
}
