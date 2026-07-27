/**
 * Splash — وب (اسپلش HTML داخل index.html)
 */

export function prepareSplash() {
  // اسپلش HTML توسط اسکریپت index.html مدیریت می‌شود
}

export async function hideSplash() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return
  splash.classList.add('hidden')
  window.setTimeout(() => {
    splash.remove()
  }, 320)
}

export function shouldUseHtmlSplash() {
  return true
}
