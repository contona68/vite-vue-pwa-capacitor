/**
 * Print — native (ViewApp PrintManager)
 * اگر PrintManager روی گوشی کار نکند → fallback به window.print (مثل وب).
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
  if (webPrint.isPrintSupported()) return true
  const api = getNativeApi()
  if (typeof api?.print === 'function') return true
  const plugin = getCapacitorPlugin(capacitorPluginNames.print)
  return Boolean(plugin && typeof plugin.print === 'function')
}

/**
 * @param {{ jobName?: string }} [options]
 */
export async function printCurrentDocument(options = {}) {
  const jobName = options.jobName || 'HyperYek'
  const api = getNativeApi()

  if (typeof api?.print === 'function') {
    try {
      await api.print({ jobName })
      return { ok: true, provider: 'native' }
    } catch (error) {
      console.warn('[Print:native] PrintManager failed, falling back to window.print:', error)
      if (webPrint.isPrintSupported()) {
        return webPrint.printCurrentDocument(options)
      }
      throw error
    }
  }

  const plugin = getCapacitorPlugin(capacitorPluginNames.print)
  if (plugin && typeof plugin.print === 'function') {
    try {
      await plugin.print({ jobName })
      return { ok: true, provider: 'native-plugin' }
    } catch (error) {
      console.warn('[Print:native] plugin print failed, falling back to window.print:', error)
      if (webPrint.isPrintSupported()) {
        return webPrint.printCurrentDocument(options)
      }
      throw error
    }
  }

  return webPrint.printCurrentDocument(options)
}

export function getPrintProviderLabel() {
  const api = getNativeApi()
  if (typeof api?.print === 'function') return 'Native → fallback وب'
  return 'وب (window.print)'
}
