import { onMounted, onUnmounted, ref } from 'vue'

/** وضعیت آنلاین بودن — قابل استفاده در کامپوننت‌ها */
export function useConnectivity() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  function sync() {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
  })

  onUnmounted(() => {
    window.removeEventListener('online', sync)
    window.removeEventListener('offline', sync)
  })

  return { isOnline }
}
