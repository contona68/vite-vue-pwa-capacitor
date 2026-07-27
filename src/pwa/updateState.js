import { ref } from 'vue'

/** وقتی نسخه جدید SW آماده است true می‌شود */
export const needRefresh = ref(false)

let updateServiceWorker = null

export function setUpdateHandler(handler) {
  updateServiceWorker = handler
}

export function applyPwaUpdate() {
  needRefresh.value = false
  if (typeof updateServiceWorker === 'function') {
    updateServiceWorker(true)
  }
}

export function dismissPwaUpdate() {
  needRefresh.value = false
}
