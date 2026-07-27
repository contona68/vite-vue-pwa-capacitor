/** وضعیت شبکه مرورگر */
export function isBrowserOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}
