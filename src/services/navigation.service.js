import { navigateBack, startBackHandling } from '@/adapters/navigation'
import { getPlatformPolicy } from '@/services/platform.service'
import router from '@/router'

let stopBackHandling = null

/** اتصال بک ViewApp/سیستم به Vue Router */
export function initNavigationRuntime() {
  if (stopBackHandling) return

  stopBackHandling = startBackHandling(() => navigateBack(router))
}

export async function goBack() {
  return navigateBack(router)
}

export function shouldShowWebBackButton() {
  return Boolean(getPlatformPolicy().navigation?.showWebBackButton)
}
