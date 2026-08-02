/**
 * Print — وب (مرورگر / PWA)
 */

export function isPrintSupported() {
  return typeof window !== 'undefined' && typeof window.print === 'function'
}

/**
 * @param {{ jobName?: string }} [_options]
 */
export async function printCurrentDocument(_options = {}) {
  if (!isPrintSupported()) {
    throw new Error('window.print is not available')
  }

  window.print()
  return { ok: true, provider: 'web' }
}

export function getPrintProviderLabel() {
  return 'وب (window.print)'
}
