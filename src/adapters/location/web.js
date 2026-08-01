/**
 * Location — وب (Geolocation API + reverse geocode)
 */

import { locationSettings } from '@settings/location/defaults.js'
import { reverseGeocode } from './geocode.js'

export function isLocationSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
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
  if (!isLocationSupported()) {
    throw new Error('موقعیت مکانی در این مرورگر پشتیبانی نمی‌شود.')
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: locationSettings.enableHighAccuracy,
      timeout: locationSettings.timeoutMs,
      maximumAge: locationSettings.maximumAgeMs,
    })
  }).catch((error) => {
    throw new Error(mapGeoError(error))
  })

  const base = normalizePosition(position, 'web')
  try {
    const place = await reverseGeocode(base.latitude, base.longitude)
    return { ...base, placeName: place.placeName, address: place.address }
  } catch (_) {
    return { ...base, placeName: 'نام محل در دسترس نیست', address: null }
  }
}

export function getLocationProviderLabel() {
  return 'web'
}

function normalizePosition(position, provider) {
  const coords = position?.coords || {}
  return {
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
    accuracy: coords.accuracy == null ? null : Number(coords.accuracy),
    altitude: coords.altitude == null ? null : Number(coords.altitude),
    provider,
  }
}

function mapGeoError(error) {
  const code = error?.code
  if (code === 1) return 'اجازهٔ دسترسی به موقعیت مکانی داده نشد.'
  if (code === 2) return 'موقعیت مکانی در دسترس نیست.'
  if (code === 3) return 'دریافت موقعیت مکانی زمان‌بر شد.'
  return error?.message || 'دریافت موقعیت مکانی ناموفق بود.'
}
