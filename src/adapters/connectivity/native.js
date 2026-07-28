/**
 * Connectivity — native (ViewApp / app-capacitor)
 *
 * منبع حقیقت:
 * - ViewAppNative.getConnectivity() برای وضعیت اولیه
 * - CustomEvent `viewapp:connectivity` با { online, vpnActive }
 * - CustomEvent `viewapp:vpn` با { vpnActive }
 *
 * از navigator.onLine استفاده نمی‌شود (در WebView گمراه‌کننده است).
 * UI آفلاین سمت وب است؛ native فقط وضعیت را اعلام می‌کند.
 */

import { emitBridgeEvent, exposeWindowApi, onBridgeEvent } from '@/adapters/bridge'
import { viewAppBridge } from '@settings/capacitor/bridge.js'
import {
  getConnectivityOnline,
  getVpnActive,
  onConnectivityChange,
  setConnectivityOnline,
  setVpnActive,
} from './state'

const EVENT = viewAppBridge.connectivityEvent
const VPN_EVENT = viewAppBridge.vpnEvent

function readNativeApi() {
  if (typeof window === 'undefined') return null
  return window[viewAppBridge.nativeApi] || null
}

function normalizeOnline(detail) {
  if (typeof detail === 'boolean') return detail
  if (detail == null) return getConnectivityOnline()
  if (typeof detail.online === 'boolean') return detail.online
  if (typeof detail.isOnline === 'boolean') return detail.isOnline
  if (typeof detail.connected === 'boolean') return detail.connected
  return Boolean(detail)
}

function normalizeVpn(detail) {
  if (typeof detail === 'boolean') return detail
  if (detail == null) return getVpnActive()
  if (typeof detail.vpnActive === 'boolean') return detail.vpnActive
  return Boolean(detail.vpnActive)
}

function applyConnectivityDetail(detail, onChange) {
  const online = normalizeOnline(detail)
  setConnectivityOnline(online)
  if (detail && typeof detail === 'object' && 'vpnActive' in detail) {
    setVpnActive(normalizeVpn(detail))
  }
  onChange?.(online)
  return online
}

function ensureOptionalWebHooks(onChange) {
  // برای تست/ابزار؛ native از ViewAppConnectivity استفاده نمی‌کند
  exposeWindowApi(viewAppBridge.connectivityApi, {
    setOnline(online) {
      const value = applyConnectivityDetail({ online }, onChange)
      emitBridgeEvent(EVENT, { online: value, vpnActive: getVpnActive() })
      return true
    },
    notify(online) {
      return this.setOnline(online)
    },
  })
}

async function seedFromNative(onChange) {
  const api = readNativeApi()
  if (!api || typeof api.getConnectivity !== 'function') return

  try {
    const result = await api.getConnectivity()
    applyConnectivityDetail(result, onChange)
  } catch (error) {
    console.warn('[Connectivity:native] getConnectivity failed:', error)
  }
}

export function readOnline() {
  return getConnectivityOnline()
}

/**
 * @param {(online: boolean) => void} onChange
 * @returns {() => void}
 */
export function subscribeOnline(onChange) {
  ensureOptionalWebHooks(onChange)
  void seedFromNative(onChange)

  const unsubscribeConnectivity = onBridgeEvent(EVENT, (detail) => {
    applyConnectivityDetail(detail, onChange)
  })

  const unsubscribeVpn = onBridgeEvent(VPN_EVENT, (detail) => {
    setVpnActive(normalizeVpn(detail))
  })

  const unsubscribeState = onConnectivityChange(onChange)

  return () => {
    unsubscribeConnectivity()
    unsubscribeVpn()
    unsubscribeState()
  }
}
