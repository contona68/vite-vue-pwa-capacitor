/**
 * وضعیت اتصال مشترک — مستقل از Vue
 * وب و native هر دو همین store را به‌روز می‌کنند.
 */

let online =
  typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true

/** وضعیت VPN — فقط از لایهٔ native معنا دارد؛ در وب معمولاً false می‌ماند */
let vpnActive = false

const listeners = new Set()
const vpnListeners = new Set()

export function getConnectivityOnline() {
  return online
}

export function getVpnActive() {
  return vpnActive
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

export function setVpnActive(nextVpnActive) {
  const value = Boolean(nextVpnActive)
  if (vpnActive === value) return vpnActive
  vpnActive = value
  vpnListeners.forEach((listener) => {
    try {
      listener(vpnActive)
    } catch (error) {
      console.warn('[Connectivity] vpn listener failed:', error)
    }
  })
  return vpnActive
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

/**
 * @param {(vpnActive: boolean) => void} listener
 * @returns {() => void}
 */
export function onVpnChange(listener) {
  vpnListeners.add(listener)
  return () => {
    vpnListeners.delete(listener)
  }
}
