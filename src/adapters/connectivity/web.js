/**
 * Connectivity — وب / PWA (navigator.onLine)
 */

import { onConnectivityChange, setConnectivityOnline } from './state'

export function readOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * @param {(online: boolean) => void} onChange
 * @returns {() => void}
 */
export function subscribeOnline(onChange) {
  setConnectivityOnline(readOnline())

  const sync = () => {
    const online = readOnline()
    setConnectivityOnline(online)
    onChange(online)
  }

  window.addEventListener('online', sync)
  window.addEventListener('offline', sync)

  const unsubscribeState = onConnectivityChange(onChange)

  return () => {
    window.removeEventListener('online', sync)
    window.removeEventListener('offline', sync)
    unsubscribeState()
  }
}
