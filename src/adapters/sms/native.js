/**
 * SMS / OTP — پیاده‌سازی native (Capacitor)
 *
 * منبع کد:
 * ۱) پلاگین Capacitor در صورت نصب در پروژهٔ APK
 * ۲) پل ViewApp: window.ViewAppOtp.receive(code) یا رویداد viewapp:otp-received
 */

import {
  emitBridgeEvent,
  exposeWindowApi,
  getCapacitorPlugin,
  onBridgeEvent,
} from '@/adapters/bridge'
import { capacitorPluginNames } from '@settings/capacitor/plugins.js'
import { smsSettings } from '@settings/sms/defaults.js'
import { viewAppBridge } from '@settings/capacitor/bridge.js'

const OTP_EVENT = smsSettings.otpBridgeEvent || viewAppBridge.otpEvent

function ensureReceiveBridge() {
  exposeWindowApi(viewAppBridge.otpApi, {
    receive(code) {
      emitBridgeEvent(OTP_EVENT, { code: String(code ?? ''), fromSms: true })
      return true
    },
  })
}

function listenViaBridge(signal) {
  ensureReceiveBridge()

  return new Promise((resolve, reject) => {
    const unsubscribe = onBridgeEvent(OTP_EVENT, (detail) => {
      cleanup()
      const code = detail?.code ?? detail
      resolve(code == null || code === '' ? null : String(code))
    })

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    function cleanup() {
      unsubscribe()
      signal?.removeEventListener('abort', onAbort)
    }

    if (signal?.aborted) {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * @returns {Promise<string|null>}
 */
async function tryListenViaPlugin(signal) {
  let plugin = null
  for (const name of capacitorPluginNames.smsRetriever) {
    plugin = getCapacitorPlugin(name)
    if (plugin) break
  }

  if (!plugin) return null

  if (typeof plugin.addListener !== 'function') {
    if (typeof plugin.startListening === 'function') {
      const result = await plugin.startListening()
      return result?.message || result?.sms || result?.body || null
    }
    return null
  }

  return new Promise((resolve, reject) => {
    let handle = null
    let cleaned = false

    const cleanup = async () => {
      if (cleaned) return
      cleaned = true
      signal?.removeEventListener('abort', onAbort)
      try {
        await handle?.remove?.()
      } catch (_) {
        // ignore
      }
    }

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    plugin
      .addListener('smsReceived', async (event) => {
        const message = event?.message || event?.body || event?.sms || ''
        await cleanup()
        resolve(message || null)
      })
      .then((h) => {
        handle = h
        if (typeof plugin.start === 'function') {
          return plugin.start()
        }
        return undefined
      })
      .catch((error) => {
        cleanup()
        reject(error)
      })
  })
}

export function isSmsAutoFillAvailable() {
  return true
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<string|null>}
 */
export async function listenForSmsOtp(signal) {
  ensureReceiveBridge()

  const bridgePromise = listenViaBridge(signal)

  const pluginPromise = tryListenViaPlugin(signal).catch((error) => {
    if (error?.name === 'AbortError') throw error
    console.warn('[SMS:native] plugin unavailable or failed:', error)
    return new Promise(() => {})
  })

  // اگر پلاگین null برگرداند، فقط bridge معتبر است
  const pluginOrHang = pluginPromise.then((value) => {
    if (value == null || value === '') return new Promise(() => {})
    return value
  })

  return Promise.race([bridgePromise, pluginOrHang])
}
