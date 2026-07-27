/**
 * پل ارتباطی با لایهٔ native (Capacitor ViewApp)
 * مستقل از Vue — قابل استفاده از هر adapter.
 */

const LISTENERS = new Map()

/**
 * ثبت API روی window برای فراخوانی از native (evaluateJavascript)
 * @param {string} namespace
 * @param {Record<string, Function>} api
 */
export function exposeWindowApi(namespace, api) {
  if (typeof window === 'undefined') return
  const previous = window[namespace] && typeof window[namespace] === 'object' ? window[namespace] : {}
  window[namespace] = { ...previous, ...api }
}

/**
 * گوش دادن به CustomEvent از native
 * @param {string} eventName
 * @param {(detail: any) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onBridgeEvent(eventName, handler) {
  if (typeof window === 'undefined') return () => {}

  const listener = (event) => {
    handler(event?.detail)
  }

  window.addEventListener(eventName, listener)

  if (!LISTENERS.has(eventName)) {
    LISTENERS.set(eventName, new Set())
  }
  LISTENERS.get(eventName).add(listener)

  return () => {
    window.removeEventListener(eventName, listener)
    LISTENERS.get(eventName)?.delete(listener)
  }
}

/**
 * ارسال رویداد به لایهٔ وب (از داخل همین اپ یا native inject)
 * @param {string} eventName
 * @param {any} detail
 */
export function emitBridgeEvent(eventName, detail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}

/**
 * خواندن پلاگین Capacitor از window در صورت نبود import مستقیم
 * @param {string} pluginName
 */
export function getCapacitorPlugin(pluginName) {
  try {
    const Cap = window.Capacitor
    if (!Cap?.Plugins) return null
    return Cap.Plugins[pluginName] || null
  } catch (_) {
    return null
  }
}
