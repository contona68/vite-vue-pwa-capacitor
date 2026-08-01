import { needRefresh, setUpdateHandler } from '@/pwa/updateState'
import { projectPwaConfig } from '@settings/pwa/runtime.js'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'
import { isPwaCapabilityEnabled } from '@/services/platform.service'

function updatesUiEnabled() {
  return isPwaCapabilityEnabled('updateBanner')
}

/**
 * فقط وقتی نسخهٔ جدید واقعاً waiting است بنر را نشان بده.
 * @param {ServiceWorkerRegistration | null | undefined} registration
 * @param {{ trustPlugin?: boolean }} [options]
 */
function announceUpdateAvailable(registration, options = {}) {
  if (!updatesUiEnabled()) return

  const trustPlugin = Boolean(options.trustPlugin)
  if (!trustPlugin && !hasWaitingWorker(registration)) {
    return
  }

  needRefresh.value = true
  console.info('[PWA] Update available — banner should show')
}

function hasWaitingWorker(registration) {
  return Boolean(registration?.waiting)
}

/**
 * فقط SW در حالت waiting = آپدیت واقعی (نه نصب اول).
 */
function watchRegistrationForWaiting(registration) {
  if (!registration) return () => {}

  const onStateChange = (worker) => {
    if (!worker) return () => {}
    const handle = () => {
      // آپدیت واقعی: worker جدید installed شده و در waiting است و قبلاً controller داشته‌ایم
      const isRealUpdate =
        worker.state === 'installed' &&
        registration.waiting === worker &&
        Boolean(navigator.serviceWorker.controller)

      if (isRealUpdate) {
        announceUpdateAvailable(registration)
      }
    }
    worker.addEventListener('statechange', handle)
    handle()
    return () => worker.removeEventListener('statechange', handle)
  }

  if (hasWaitingWorker(registration) && navigator.serviceWorker.controller) {
    announceUpdateAvailable(registration)
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
      if (hasWaitingWorker(registration) && navigator.serviceWorker.controller) {
        announceUpdateAvailable(registration)
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
    ;[1000, 3000, 8000, 20000].forEach((ms) => {
      window.setTimeout(() => {
        checkForUpdate(registration)
      }, ms)
    })
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // vite-plugin-pwa فقط وقتی SW جدید waiting است این را صدا می‌زند
      if (enableUpdateUi) {
        announceUpdateAvailable(activeRegistration, { trustPlugin: true })
      }
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
      // نصب اول SW — بنر آپدیت نشان نده
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

  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
  window.addEventListener('pageshow', onVisible)

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      needRefresh.value = false
    })
  }
}
