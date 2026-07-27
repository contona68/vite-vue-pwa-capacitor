/** مسیر عمومی نسبت به base اپ (مثلاً GitHub Pages) */
export function publicUrl(path) {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = String(path || '').replace(/^\/+/, '')
  return `${base}${normalized}`
}

export const APP_ICON_192 = publicUrl('icons/android-chrome-192x192.png')
