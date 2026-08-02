/**
 * Barcode — native (ViewApp)
 *
 * مسیر اصلی: Google Code Scanner از طریق بریج.
 * بدون لایبرری JS — اگر native کار نکند فقط پیام «پشتیبانی نمی‌شود».
 */

import { viewAppBridge } from '@settings/capacitor/bridge.js'

const UNSUPPORTED_MESSAGE = 'بارکدخوان در این دستگاه پشتیبانی نمی‌شود.'

function getNativeApi() {
  try {
    return window[viewAppBridge.nativeApi] || null
  } catch (_) {
    return null
  }
}

function isUserCancel(error) {
  const message = String(error?.message || error || '')
  return /لغو|cancel/i.test(message)
}

export async function isBarcodeSupported() {
  const api = getNativeApi()
  return typeof api?.scanBarcode === 'function'
}

export function getBarcodeProviderLabel() {
  return typeof getNativeApi()?.scanBarcode === 'function'
    ? 'native-scanner'
    : 'unsupported'
}

/**
 * @param {{
 *   videoElement?: HTMLVideoElement,
 *   onDetected?: (result: { rawValue: string, format: string }) => void
 * }} [options]
 */
export async function startBarcodeScan(options = {}) {
  const { onDetected } = options
  const api = getNativeApi()

  if (typeof api?.scanBarcode !== 'function') {
    throw new Error(UNSUPPORTED_MESSAGE)
  }

  try {
    const result = await api.scanBarcode()
    if (result?.rawValue && typeof onDetected === 'function') {
      onDetected({
        rawValue: String(result.rawValue),
        format: String(result.format || 'unknown'),
      })
    }
    return { mode: 'native-scanner' }
  } catch (error) {
    if (isUserCancel(error)) {
      throw error
    }
    console.warn('[Barcode:native] scanner unavailable:', error)
    throw new Error(UNSUPPORTED_MESSAGE)
  }
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [_options]
 */
export async function stopBarcodeScan(_options = {}) {
  // one-shot native scanner — nothing to tear down
}

/**
 * @param {{
 *   videoElement?: HTMLVideoElement,
 *   onDetected?: (result: { rawValue: string, format: string }) => void
 * }} [options]
 */
export async function resetBarcodeScan(options = {}) {
  return startBarcodeScan(options)
}
