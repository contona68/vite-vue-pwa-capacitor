import { onMounted, onUnmounted, ref } from 'vue'
import {
  getConnectivityOnline,
  onConnectivityChange,
  startConnectivityRuntime,
} from '@/adapters/connectivity'
import { getPlatformPolicy } from '@/services/platform.service'

let runtimeStarted = false
let stopRuntime = null

/** شروع یک‌بارهٔ منبع وضعیت شبکه (وب یا ViewApp) */
export function initConnectivityRuntime() {
  if (runtimeStarted) return
  runtimeStarted = true
  stopRuntime = startConnectivityRuntime()
}

export function isAppOnline() {
  return getConnectivityOnline()
}

/** آیا UI آفلاین وب باید نشان داده شود؟ در native معمولاً overlay سمت ViewApp است */
export function shouldShowWebConnectivityUi() {
  return Boolean(getPlatformPolicy().connectivity?.showWebUi)
}

/** وضعیت آنلاین بودن — قابل استفاده در کامپوننت‌ها */
export function useConnectivity() {
  const isOnline = ref(getConnectivityOnline())

  let unsubscribe = null

  onMounted(() => {
    isOnline.value = getConnectivityOnline()
    unsubscribe = onConnectivityChange((online) => {
      isOnline.value = online
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return { isOnline }
}
