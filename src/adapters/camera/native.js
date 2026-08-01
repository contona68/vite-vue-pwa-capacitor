/**
 * Camera — native (Capacitor / ViewApp)
 *
 * اولویت:
 * 1) ViewAppNative (اگر shell متد دوربین expose کند)
 * 2) استریم داخل WebView (getUserMedia) برای UX مشابه وب
 * 3) پلاگین Capacitor Camera برای گرفتن عکس سیستم
 */

import { getCapacitorPlugin } from '@/adapters/bridge'
import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { cameraSettings } from '@settings/camera/defaults.js'
import * as webCamera from './web'

function getNativeApi() {
  try {
    return window[viewAppBridge.nativeApi] || null
  } catch (_) {
    return null
  }
}

function resolveCameraPlugin() {
  for (const name of cameraSettings.pluginNames) {
    const plugin = getCapacitorPlugin(name)
    if (plugin) return plugin
  }
  return null
}

export async function isCameraSupported() {
  const api = getNativeApi()
  if (typeof api?.takePicture === 'function' || typeof api?.openCamera === 'function') {
    return true
  }
  if (resolveCameraPlugin()) return true
  return webCamera.isCameraSupported()
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [options]
 */
export async function openCamera(options = {}) {
  const api = getNativeApi()

  if (typeof api?.openCamera === 'function') {
    await api.openCamera()
    return { mode: 'native-bridge' }
  }

  // WebView اغلب getUserMedia را پشتیبانی می‌کند
  if (options.videoElement && (await webCamera.isCameraSupported())) {
    try {
      return await webCamera.openCamera(options)
    } catch (error) {
      console.warn('[Camera:native] getUserMedia failed, will use plugin on capture:', error)
    }
  }

  const plugin = resolveCameraPlugin()
  if (plugin?.requestPermissions) {
    try {
      await plugin.requestPermissions({ permissions: ['camera'] })
    } catch (_) {
      // بعضی نسخه‌ها permissions ساده‌تر دارند
      try {
        await plugin.requestPermissions()
      } catch (error) {
        console.warn('[Camera:native] requestPermissions failed:', error)
      }
    }
  }

  if (plugin || api) {
    return { mode: 'native-prompt' }
  }

  throw new Error('دوربین native در این محیط در دسترس نیست.')
}

export async function resetCamera(options = {}) {
  await closeCamera(options)
  return openCamera(options)
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [options]
 */
export async function closeCamera(options = {}) {
  const api = getNativeApi()
  if (typeof api?.closeCamera === 'function') {
    try {
      await api.closeCamera()
    } catch (_) {
      // ignore
    }
  }
  await webCamera.closeCamera(options)
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [options]
 * @returns {Promise<{ dataUrl: string }>}
 */
export async function capturePhoto(options = {}) {
  const api = getNativeApi()

  if (typeof api?.takePicture === 'function') {
    const result = await api.takePicture()
    const dataUrl = normalizeDataUrl(result?.dataUrl || result?.base64 || result)
    if (!dataUrl) {
      throw new Error('خروجی عکس از لایهٔ native معتبر نبود.')
    }
    return { dataUrl }
  }

  // اگر استریم وب داخل WebView فعال است
  try {
    return await webCamera.capturePhoto(options)
  } catch (_) {
    // ادامه با پلاگین
  }

  const plugin = resolveCameraPlugin()
  if (!plugin?.getPhoto) {
    throw new Error('پلاگین Camera در پروژهٔ native نصب یا در دسترس نیست.')
  }

  const photo = await plugin.getPhoto({
    quality: cameraSettings.nativeQuality,
    allowEditing: false,
    resultType: 'dataUrl',
    source: 'CAMERA',
    correctOrientation: true,
  })

  const dataUrl = normalizeDataUrl(photo?.dataUrl || photo?.base64String)
  if (!dataUrl) {
    throw new Error('گرفتن عکس از دوربین native ناموفق بود.')
  }
  return { dataUrl }
}

function normalizeDataUrl(value) {
  if (typeof value !== 'string' || !value) return ''
  if (value.startsWith('data:')) return value
  return `data:image/jpeg;base64,${value}`
}

export function getCameraProviderLabel() {
  return 'native'
}
