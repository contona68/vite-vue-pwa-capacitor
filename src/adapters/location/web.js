/**
 * Location — وب (Geolocation API)
 */

import { locationSettings } from '@settings/location/defaults.js'

export function isLocationSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
}

/**
 * @returns {Promise<{ latitude: number, longitude: number, accuracy: number|null, altitude: number|null, provider: string }>}
 */
export function getCurrentPosition() {
  if (!isLocationSupported()) {
    return Promise.reject(new Error('موقعیت مکانی در این مرورگر پشتیبانی نمی‌شود.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(normalizePosition(position, 'web'))
      },
      (error) => {
        reject(new Error(mapGeoError(error)))
      },
      {
        enableHighAccuracy: locationSettings.enableHighAccuracy,
        timeout: locationSettings.timeoutMs,
        maximumAge: locationSettings.maximumAgeMs,
      },
    )
  })
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
