/**
 * Barcode — وب
 * فعلاً پشتیبانی نمی‌شود؛ فقط اطلاع به کاربر.
 */

const UNAVAILABLE_MESSAGE = 'بارکدخوان فعلاً در نسخهٔ وب در دسترس نیست.'

export async function isBarcodeSupported() {
  return false
}

export function getBarcodeProviderLabel() {
  return 'web'
}

/**
 * @returns {never}
 */
export async function startBarcodeScan() {
  window.alert(UNAVAILABLE_MESSAGE)
  throw new Error(UNAVAILABLE_MESSAGE)
}

export async function stopBarcodeScan() {
  // no-op
}

/**
 * @returns {never}
 */
export async function resetBarcodeScan() {
  return startBarcodeScan()
}
