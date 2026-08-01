/**
 * Location — native (ViewApp / Geolocation در WebView)
 *
 * اولویت:
 * 1) ViewAppNative.getLocation()
 * 2) Geolocation API داخل WebView (با اجازهٔ runtime shell)
 */

import { viewAppBridge } from '@settings/capacitor/bridge.js'
import * as webLocation from './web'

function getNativeApi() {
  try {
    return window[viewAppBridge.nativeApi] || null
  } catch (_) {
    return null
  }
}

export function isLocationSupported() {
  const api = getNativeApi()
  if (typeof api?.getLocation === 'function') {
    return true
  }
  return webLocation.isLocationSupported()
}

/**
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number|null, altitude: number|null, provider: string }>}
 */
export async function getCurrentPosition() {
  const api = getNativeApi()
  if (typeof api?.getLocation === 'function') {
    const result = await api.getLocation()
    if (result == null || result.latitude == null || result.longitude == null) {
      throw new Error('خروجی موقعیت از لایهٔ native معتبر نبود.')
    }
    return {
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      accuracy: result.accuracy == null ? null : Number(result.accuracy),
      altitude: result.altitude == null ? null : Number(result.altitude),
      provider: 'native',
    }
  }

  const position = await webLocation.getCurrentPosition()
  return { ...position, provider: 'native-webview' }
}

export function getLocationProviderLabel() {
  return 'native'
}
