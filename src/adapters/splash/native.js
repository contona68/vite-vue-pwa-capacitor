/**
 * Splash — native (Capacitor SplashScreen / ViewApp)
 * اسپلش HTML را تا hide نگه می‌داریم تا بعد از خروج اسپلش سیستم صفحه سفید دیده نشود.
 */

import { getCapacitorPlugin } from '@/adapters/bridge'
import { capacitorPluginNames } from '@settings/capacitor/plugins.js'
import { splashSettings } from '@settings/splash/defaults.js'

export function prepareSplash() {
  const splash = document.getElementById(splashSettings.bootSplashElementId)
  if (!splash) return
  // سفید → کدویی (همراه با CSS داخل index.html)
  splash.classList.add('is-pumpkin')
}

export async function hideSplash() {
  const plugin = getCapacitorPlugin(capacitorPluginNames.splashScreen)
  if (plugin && typeof plugin.hide === 'function') {
    try {
      await plugin.hide()
    } catch (error) {
      console.warn('[Splash:native] hide failed:', error)
    }
  }

  const splash = document.getElementById(splashSettings.bootSplashElementId)
  if (!splash) return
  splash.classList.add('hidden')
  window.setTimeout(() => {
    splash.remove()
  }, 320)
}

export function shouldUseHtmlSplash() {
  return true
}
