import { needRefresh, setUpdateHandler } from '@/pwa/updateState'
import { projectPwaConfig } from '@settings/pwa/runtime.js'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'
import { isFeatureEnabled } from '@/services/appConfig.service'
import { isPwaCapabilityEnabled } from '@/services/platform.service'

function canAnnounceUpdate() {
  return isFeatureEnabled('updateBanner') && isPwaCapabilityEnabled('updateBanner')
}

function announceUpdateAvailable() {
  if (!canAnnounceUpdate()) return
  needRefresh.value = true
}

/**
 * اگر SW در حالت waiting باشد (نسخه جدید نصب‌شده و منتظر فعال‌سازی)، بنر را نشان بده.
 * علاوه بر onNeedRefresh خود vite-plugin-pwa — بعضی مرورگرها/تایمینگ‌ها آن را از دست می‌دهند.
 */
function watchRegistrationForWaiting(registration) {
  if (!registration) return () => {}

  const onStateChange = (worker) => {
    if (!worker) return
    const handle = () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        announceUpdateAvailable()
      }
    }
    worker.addEventListener('statechange', handle)
    handle()
    return () => worker.removeEventListener('statechange', handle)
  }

  if (registration.waiting) {
    announceUpdateAvailable()
  }

  let stopInstallingWatch = null
  const onUpdateFound = () => {
    stopInstallingWatch?.()
    stopInstallingWatch = onStateChange(registration.installing)
  }

  registration.addEventListener('updatefound', onUpdateFound)
  if (registration.installing) {
    stopInstallingWatch = onStateChange(registration.installing)
  }

  return () => {
    registration.removeEventListener('updatefound', onUpdateFound)
    stopInstallingWatch?.()
  }
}

/** ثبت SW برای کش آفلاین لاگین + اعلام نسخه جدید در وب */
export async function setupPwaRuntime() {
  if (!projectPwaConfig.loginOfflineCache || !isPwaCapabilityEnabled('loginOfflineCache')) {
    console.info('[PWA] Login offline cache skipped (project or platform policy)')
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
  let activeRegistration = null
  let stopWaitingWatch = null

  async function checkForUpdate(registration = activeRegistration) {
    if (!registration || isCheckingUpdate) return
    isCheckingUpdate = true
    try {
      await registration.update()
      if (registration.waiting) {
        announceUpdateAvailable()
      }
      console.info('[PWA] Checked for service worker update')
    } catch (error) {
      console.warn('[PWA] Update check failed:', error)
    } finally {
      isCheckingUpdate = false
    }
  }

  function bindRegistration(registration) {
    if (!registration || activeRegistration === registration) return
    activeRegistration = registration
    stopWaitingWatch?.()
    stopWaitingWatch = watchRegistrationForWaiting(registration)
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      announceUpdateAvailable()
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      bindRegistration(registration)
      checkForUpdate(registration)
      window.setInterval(() => {
        checkForUpdate(registration)
      }, pwaInstallPolicy.updateCheckIntervalMs)
      console.info('[PWA] Service Worker registered:', swUrl)
    },
    onOfflineReady() {
      console.info('[PWA] Login shell ready to work offline')
    },
  })

  setUpdateHandler(updateSW)

  // وقتی کاربر به تب برمی‌گردد، فوراً نسخه جدید را چک کن
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate()
    }
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
}
