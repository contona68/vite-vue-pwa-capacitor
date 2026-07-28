/**
 * نمای یکپارچهٔ Connectivity — وب در برابر ViewApp
 */

import { isNativePlatform } from '@/platform/env'
import { getConnectivityOnline } from './state'
import * as nativeConnectivity from './native'
import * as webConnectivity from './web'

function provider() {
  return isNativePlatform() ? nativeConnectivity : webConnectivity
}

export { getConnectivityOnline, getVpnActive, onConnectivityChange, onVpnChange } from './state'

export function readOnline() {
  return provider().readOnline()
}

/**
 * @param {(online: boolean) => void} onChange
 * @returns {() => void}
 */
export function subscribeOnline(onChange) {
  return provider().subscribeOnline(onChange)
}

/** شروع runtime — یک‌بار در bootstrap */
export function startConnectivityRuntime() {
  return subscribeOnline(() => {})
}
