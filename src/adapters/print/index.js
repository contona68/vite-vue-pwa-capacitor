/**
 * نمای یکپارچهٔ Print — انتخاب web / native بر اساس محیط
 */

import { isNativePlatform } from '@/platform/env'
import * as nativePrint from './native'
import * as webPrint from './web'

function provider() {
  return isNativePlatform() ? nativePrint : webPrint
}

export function isPrintSupported() {
  return provider().isPrintSupported()
}

/**
 * @param {{ jobName?: string }} [options]
 */
export function printCurrentDocument(options) {
  return provider().printCurrentDocument(options)
}

export function getPrintProviderLabel() {
  return provider().getPrintProviderLabel()
}
