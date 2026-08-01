/**
 * نمای یکپارچهٔ Barcode — انتخاب provider بر اساس محیط اجرا
 */

import { isNativePlatform } from '@/platform/env'
import * as nativeBarcode from './native'
import * as webBarcode from './web'

function provider() {
  return isNativePlatform() ? nativeBarcode : webBarcode
}

export function isBarcodeSupported() {
  return provider().isBarcodeSupported()
}

export function startBarcodeScan(options) {
  return provider().startBarcodeScan(options)
}

export function stopBarcodeScan(options) {
  return provider().stopBarcodeScan(options)
}

export function resetBarcodeScan(options) {
  return provider().resetBarcodeScan(options)
}

export function getBarcodeProviderLabel() {
  return provider().getBarcodeProviderLabel()
}
