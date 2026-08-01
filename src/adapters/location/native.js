/**
 * Location — native (ViewApp / Geolocation در WebView)
 *
 * اولویت:
 * 1) ViewAppNative.getLocation() (با نام محل اگر shell بدهد)
 * 2) Geolocation API داخل WebView + reverse geocode وب
 */

import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { reverseGeocode } from './geocode.js'
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
 * @returns {Promise<{
 *   latitude: number,
 *   longitude: number,
 *   accuracy: number|null,
 *   altitude: number|null,
 *   placeName: string,
 *   address: string|null,
 *   provider: string
 * }>}
 */
export async function getCurrentPosition() {
  const api = getNativeApi()
  if (typeof api?.getLocation === 'function') {
    const result = await api.getLocation()
    if (result == null || result.latitude == null || result.longitude == null) {
      throw new Error('خروجی موقعیت از لایهٔ native معتبر نبود.')
    }

    const base = {
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      accuracy: result.accuracy == null ? null : Number(result.accuracy),
      altitude: result.altitude == null ? null : Number(result.altitude),
      placeName: typeof result.placeName === 'string' ? result.placeName : '',
      address: typeof result.address === 'string' ? result.address : null,
      provider: 'native',
    }

    if (base.placeName) {
      return base
    }

    try {
      const place = await reverseGeocode(base.latitude, base.longitude)
      return { ...base, placeName: place.placeName, address: place.address || base.address }
    } catch (_) {
      return { ...base, placeName: base.placeName || 'نام محل در دسترس نیست' }
    }
  }

  const position = await webLocation.getCurrentPosition()
  return { ...position, provider: 'native-webview' }
}

export function getLocationProviderLabel() {
  return 'native'
}
