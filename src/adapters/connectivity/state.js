/**
 * وضعیت اتصال مشترک — مستقل از Vue
 * وب و native هر دو همین store را به‌روز می‌کنند.
 */

let online =
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true

const listeners = new Set()

export function getConnectivityOnline() {
  return online
}

export function setConnectivityOnline(nextOnline) {
  const value = Boolean(nextOnline)
  if (online === value) return online
  online = value
  listeners.forEach((listener) => {
    try {
      listener(online)
    } catch (error) {
      console.warn('[Connectivity] listener failed:', error)
    }
  })
  return online
}

/**
 * @param {(online: boolean) => void} listener
 * @returns {() => void}
 */
export function onConnectivityChange(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
