/**
 * Navigation — native (ViewApp / Capacitor App)
 *
 * منابع بک:
 * ۱) CustomEvent `viewapp:back`
 * ۲) window.ViewAppNav.back()
 * ۳) Capacitor Plugins.App backButton (در صورت نصب)
 */

import { exposeWindowApi, getCapacitorPlugin, onBridgeEvent } from '@/adapters/bridge'
import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { capacitorPluginNames } from '@settings/capacitor/plugins.js'

/**
 * @param {() => void | Promise<void>} onBackRequest
 * @returns {() => void}
 */
export function startBackHandling(onBackRequest) {
  const runBack = () => {
    Promise.resolve(onBackRequest()).catch((error) => {
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
