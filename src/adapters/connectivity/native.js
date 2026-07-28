/**
 * Connectivity — native (ViewApp)
 *
 * منبع حقیقت: لایهٔ دستگاه از طریق
 * - CustomEvent `viewapp:connectivity` با detail: { online: boolean }
 * - یا window.ViewAppConnectivity.setOnline(boolean)
 *
 * از navigator.onLine استفاده نمی‌شود (در WebView گمراه‌کننده است).
 */

import { emitBridgeEvent, exposeWindowApi, onBridgeEvent } from '@/adapters/bridge'
import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { getConnectivityOnline, onConnectivityChange, setConnectivityOnline } from './state'

const EVENT = viewAppBridge.connectivityEvent

function normalizeOnline(detail) {
  if (typeof detail === 'boolean') return detail
  if (detail == null) return true
  if (typeof detail.online === 'boolean') return detail.online
  if (typeof detail.isOnline === 'boolean') return detail.isOnline
  if (typeof detail.connected === 'boolean') return detail.connected
  return Boolean(detail)
}

function applyOnline(detail, onChange) {
  const online = normalizeOnline(detail)
  setConnectivityOnline(online)
  onChange?.(online)
  return online
}

function ensureReceiveBridge(onChange) {
  exposeWindowApi(viewAppBridge.connectivityApi, {
    setOnline(online) {
      const value = applyOnline(online, onChange)
      emitBridgeEvent(EVENT, { online: value })
      return true
    },
    notify(online) {
      return this.setOnline(online)
    },
  })
}

export function readOnline() {
  return getConnectivityOnline()
}

/**
 * @param {(online: boolean) => void} onChange
 * @returns {() => void}
 */
export function subscribeOnline(onChange) {
  ensureReceiveBridge(onChange)

  const unsubscribeEvent = onBridgeEvent(EVENT, (detail) => {
    applyOnline(detail, onChange)
  })

  const unsubscribeState = onConnectivityChange(onChange)

  return () => {
    unsubscribeEvent()
    unsubscribeState()
  }
}
