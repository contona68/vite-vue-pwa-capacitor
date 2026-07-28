import { needRefresh, setUpdateHandler } from '@/pwa/updateState'
import { projectPwaConfig } from '@settings/pwa/runtime.js'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'
import { isFeatureEnabled } from '@/services/appConfig.service'
import { isPwaCapabilityEnabled } from '@/services/platform.service'

/** ثبت PWA / SW بر اساس کانفیگ پروژه و سیاست محیط */
export async function setupPwaRuntime() {
  if (!projectPwaConfig.runtimeRegistration || !isPwaCapabilityEnabled('runtimeRegistration')) {
    console.info('[PWA] Runtime registration skipped (project or platform policy)')
    return
  }

  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
    return
  }

  const { registerSW } = await import('virtual:pwa-register')

  let isCheckingUpdate = false

  async function checkForUpdate(registration) {
    if (!registration || isCheckingUpdate) return
    isCheckingUpdate = true
    try {
      await registration.update()
      console.info('[PWA] Checked for service worker update')
    } catch (error) {
      console.warn('[PWA] Update check failed:', error)
    } finally {
      isCheckingUpdate = false
    }
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (isFeatureEnabled('updateBanner') && isPwaCapabilityEnabled('updateBanner')) {
        needRefresh.value = true
      }
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      checkForUpdate(registration)
      window.setInterval(() => {
        checkForUpdate(registration)
      }, pwaInstallPolicy.updateCheckIntervalMs)
      console.info('[PWA] Service Worker registered:', swUrl)
    },
    onOfflineReady() {
      console.info('[PWA] App ready to work offline')
    },
  })

  setUpdateHandler(updateSW)
}
