/**
 * Print — native (ViewApp PrintManager)
 * اگر بریج native نباشد، به window.print به‌عنوان fallback می‌رود.
 */

import { getCapacitorPlugin } from '@/adapters/bridge'
import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { capacitorPluginNames } from '@settings/capacitor/plugins.js'
import * as webPrint from './web'

function getNativeApi() {
  try {
    return window[viewAppBridge.nativeApi] || null
  } catch (_) {
    return null
  }
}

export function isPrintSupported() {
  const api = getNativeApi()
  if (typeof api?.print === 'function') return true
  const plugin = getCapacitorPlugin(capacitorPluginNames.print)
  if (plugin && typeof plugin.print === 'function') return true
  return webPrint.isPrintSupported()
}

/**
 * @param {{ jobName?: string }} [options]
 */
export async function printCurrentDocument(options = {}) {
  const api = getNativeApi()
  if (typeof api?.print === 'function') {
    await api.print({ jobName: options.jobName || 'HyperYek' })
    return { ok: true, provider: 'native' }
  }

  const plugin = getCapacitorPlugin(capacitorPluginNames.print)
  if (plugin && typeof plugin.print === 'function') {
    await plugin.print({ jobName: options.jobName || 'HyperYek' })
    return { ok: true, provider: 'native-plugin' }
  }

  return webPrint.printCurrentDocument(options)
}

export function getPrintProviderLabel() {
  const api = getNativeApi()
  if (typeof api?.print === 'function') return 'Native (PrintManager)'
  return 'Native → fallback وب'
}
