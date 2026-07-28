import { getConnectivityOnline } from '@/adapters/connectivity'

/** وضعیت شبکه اپ (وب: navigator — native: ViewApp) */
export function isBrowserOnline() {
  return getConnectivityOnline()
}
