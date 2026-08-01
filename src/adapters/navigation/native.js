/**
 * Navigation — native (ViewApp)
 *
 * بک سخت‌افزاری ViewApp:
 * ۱) CustomEvent `viewapp:back`
 * ۲) window.ViewAppNav.back()
 * ۳) Capacitor Plugins.App backButton
 *
 * اگر SPA دیگر عقب نرود (`noop`)، از shell خروج درخواست می‌شود.
 * دکمهٔ بک داخل UI همیشه از Vue Router استفاده می‌کند.
 */

import { exposeWindowApi, getCapacitorPlugin, onBridgeEvent } from '@/adapters/bridge'
import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { capacitorPluginNames } from '@settings/capacitor/plugins.js'

/**
 * @param {() => void | Promise<void | string>} onBackRequest
 * @returns {() => void}
 */
export function startBackHandling(onBackRequest) {
  const runBack = () => {
    Promise.resolve(onBackRequest())
      .then((result) => {
        if (result !== 'noop') {
          return
        }

        return requestNativeExit()
      })
      .catch((error) => {
        console.warn('[Nav:native] back handler failed:', error)
      })
  }

  exposeWindowApi(viewAppBridge.navigationApi, {
    back() {
      runBack()
      return true
    },
    canGoBack() {
      return typeof window !== 'undefined' && window.history.length > 1
    },
  })

  const unsubscribeEvent = onBridgeEvent(viewAppBridge.backEvent, () => {
    runBack()
  })

  let removeAppListener = null
  const App = getCapacitorPlugin(capacitorPluginNames.app)
  if (App && typeof App.addListener === 'function') {
    Promise.resolve(App.addListener('backButton', () => runBack()))
      .then((handle) => {
        removeAppListener = () => {
          try {
            handle?.remove?.()
          } catch (_) {
            // ignore
          }
        }
      })
      .catch((error) => {
        console.warn('[Nav:native] App.backButton unavailable:', error)
      })
  }

  return () => {
    unsubscribeEvent()
    removeAppListener?.()
  }
}

async function requestNativeExit() {
  try {
    const api = window[viewAppBridge.nativeApi]
    if (api && typeof api.exitApp === 'function') {
      await api.exitApp()
      return
    }
  } catch (_) {
    // ignore
  }

  const App = getCapacitorPlugin(capacitorPluginNames.app)
  if (App && typeof App.exitApp === 'function') {
    await App.exitApp()
  }
}
