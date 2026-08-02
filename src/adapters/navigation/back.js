/**
 * Navigation / Back — منطق مشترک وب و native
 */

/**
 * آیا برای این route دکمهٔ بک UI معنا دارد؟
 * @param {string | symbol | null | undefined} routeName
 */
export function isBackableRoute(routeName) {
  return routeName === 'otp' || routeName === 'print'
}

/**
 * مسیر والد منطقی وقتی history خالی/بی‌اثر است
 * @param {string | symbol | null | undefined} routeName
 */
export function resolveFallbackRouteName(routeName) {
  if (routeName === 'otp') return 'login'
  if (routeName === 'print') return 'settings'
  return null
}

/**
 * یک پله عقب در تاریخچهٔ Vue Router؛ در صورت شکست به والد می‌رود.
 * @param {import('vue-router').Router} router
 * @returns {Promise<'history' | 'fallback' | 'noop'>}
 */
export async function navigateBack(router) {
  const current = router.currentRoute.value
  const beforePath = current.fullPath
  const fallbackName = resolveFallbackRouteName(current.name)

  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    await waitForRouteChange(router, beforePath, 120)
    if (router.currentRoute.value.fullPath !== beforePath) {
      return 'history'
    }
  }

  if (fallbackName) {
    await router.replace({ name: fallbackName })
    return 'fallback'
  }

  return 'noop'
}

function waitForRouteChange(router, beforePath, timeoutMs) {
  return new Promise((resolve) => {
    if (router.currentRoute.value.fullPath !== beforePath) {
      resolve(true)
      return
    }

    const stop = router.afterEach(() => {
      stop()
      window.clearTimeout(timer)
      resolve(true)
    })

    const timer = window.setTimeout(() => {
      stop()
      resolve(false)
    }, timeoutMs)
  })
}
