import { needRefresh, setUpdateHandler } from '@/pwa/updateState'
import { projectPwaConfig } from '@settings/pwa/runtime.js'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'
import { isFeatureEnabled } from '@/services/appConfig.service'
import { isPwaCapabilityEnabled } from '@/services/platform.service'

function updatesUiEnabled() {
  return isFeatureEnabled('updateBanner') && isPwaCapabilityEnabled('updateBanner')
}

function announceUpdateAvailable() {
  if (!updatesUiEnabled()) return
  needRefresh.value = true
  console.info('[PWA] Update available — banner should show')
}

function hasWaitingWorker(registration) {
  return Boolean(registration?.waiting)
}

/**
 * اگر SW در حالت waiting باشد (نسخه جدید نصب‌شده و منتظر فعال‌سازی)، بنر را نشان بده.
 */
function watchRegistrationForWaiting(registration) {
  if (!registration) return () => {}

  const onStateChange = (worker) => {
    if (!worker) return () => {}
    const handle = () => {
      // installed + controller = آپدیت (نه نصب اول)
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        announceUpdateAvailable()
      }
      if (worker.state === 'installed' && registration.waiting === worker) {
        announceUpdateAvailable()
      }
    }
    worker.addEventListener('statechange', handle)
    handle()
    return () => worker.removeEventListener('statechange', handle)
  }

  if (hasWaitingWorker(registration)) {
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

/**
 * ثبت SW:
 * - وب/PWA موبایل و دسکتاپ: کش لاگین + بنر آپدیت
 * - Capacitor: فقط کش لاگین
 */
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
  const enableUpdateUi = updatesUiEnabled()

  let isCheckingUpdate = false
  let activeRegistration = null
  let stopWaitingWatch = null

  async function checkForUpdate(registration = activeRegistration) {
    if (!enableUpdateUi || !registration || isCheckingUpdate) return
    isCheckingUpdate = true
    try {
      await registration.update()
      // کمی صبر: روی موبایل گاهی waiting بعد از resolve شدن update ست می‌شود
      await new Promise((resolve) => window.setTimeout(resolve, 300))
      if (hasWaitingWorker(registration)) {
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
    if (!enableUpdateUi) return
    stopWaitingWatch?.()
    stopWaitingWatch = watchRegistrationForWaiting(registration)
  }

  function scheduleMobileFriendlyRechecks(registration) {
    // PWA موبایل اغلب بعد از برگشت از پس‌زمینه دیر آپدیت را می‌بیند
    ;[1000, 3000, 8000, 20000].forEach((ms) => {
      window.setTimeout(() => {
        checkForUpdate(registration)
      }, ms)
    })
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (enableUpdateUi) announceUpdateAvailable()
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      bindRegistration(registration)
      if (enableUpdateUi) {
        checkForUpdate(registration)
        scheduleMobileFriendlyRechecks(registration)
        window.setInterval(() => {
          checkForUpdate(registration)
        }, pwaInstallPolicy.updateCheckIntervalMs)
      }
      console.info('[PWA] Service Worker registered:', swUrl)
    },
    onOfflineReady() {
      console.info('[PWA] Login shell ready to work offline')
    },
  })

  setUpdateHandler(enableUpdateUi ? updateSW : null)

  if (!enableUpdateUi) {
    console.info('[PWA] Update banner disabled for this environment (login cache only)')
    return
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate()
    }
  }

  // موبایل / PWA: focus به‌تنهایی کافی نیست
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
  window.addEventListener('pageshow', onVisible)

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // بعد از اعمال آپدیت، پرچم را پاک کن تا بنر نماند
      needRefresh.value = false
    })
  }
}
