/**
 * Splash — native (Capacitor SplashScreen)
 * اسپلش HTML وب مخفی می‌شود تا با splash native تداخل نداشته باشد.
 */

import { getCapacitorPlugin } from '@/adapters/bridge'
import { capacitorPluginNames } from '@settings/capacitor/plugins.js'
import { splashSettings } from '@settings/splash/defaults.js'

export function prepareSplash() {
  const splash = document.getElementById(splashSettings.bootSplashElementId)
  if (splash) {
    splash.classList.add('hidden')
    splash.remove()
  }
}

export async function hideSplash() {
  const plugin = getCapacitorPlugin(capacitorPluginNames.splashScreen)
  if (plugin && typeof plugin.hide === 'function') {
    try {
      await plugin.hide()
      return
    } catch (error) {
      console.warn('[Splash:native] hide failed:', error)
    }
  }

  // fallback
  const splash = document.getElementById(splashSettings.bootSplashElementId)
  if (splash) {
    splash.classList.add('hidden')
    splash.remove()
  }
}

export function shouldUseHtmlSplash() {
  return false
}
