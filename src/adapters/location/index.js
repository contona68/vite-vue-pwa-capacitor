/**
 * نمای یکپارچهٔ Location — انتخاب provider بر اساس محیط اجرا
 */

import { isNativePlatform } from '@/platform/env'
import * as nativeLocation from './native'
import * as webLocation from './web'

function provider() {
  return isNativePlatform() ? nativeLocation : webLocation
}

export function isLocationSupported() {
  return provider().isLocationSupported()
}

export function getCurrentPosition() {
  return provider().getCurrentPosition()
}

export function getLocationProviderLabel() {
  return provider().getLocationProviderLabel()
}
