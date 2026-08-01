/**
 * Camera — native (Capacitor / ViewApp)
 *
 * اولویت برای UX مشابه وب:
 * 1) استریم زنده داخل WebView (getUserMedia) → پیش‌نمایش + عکس از همان فریم
 * 2) اگر استریم ممکن نبود: ViewAppNative.takePicture / پلاگین سیستم
 *
 * openCamera روی shell فقط اجازه را آماده می‌کند؛ پیش‌نمایش از WebView است.
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
  if (await webCamera.isCameraSupported()) return true
  const api = getNativeApi()
  if (typeof api?.takePicture === 'function' || typeof api?.openCamera === 'function') {
    return true
  }
  return Boolean(resolveCameraPlugin())
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [options]
 */
export async function openCamera(options = {}) {
  const api = getNativeApi()

  // اجازهٔ native را اگر لازم است بگیر، ولی پیش‌نمایش را از WebView ادامه بده
  if (typeof api?.openCamera === 'function') {
    try {
      await api.openCamera()
    } catch (error) {
      console.warn('[Camera:native] openCamera permission/bridge failed:', error)
    }
  }

  if (options.videoElement && (await webCamera.isCameraSupported())) {
    try {
      return await webCamera.openCamera(options)
    } catch (error) {
      console.warn('[Camera:native] getUserMedia failed, fallback to system camera:', error)
    }
  }

  const plugin = resolveCameraPlugin()
  if (plugin?.requestPermissions) {
    try {
      await plugin.requestPermissions({ permissions: ['camera'] })
    } catch (_) {
      try {
        await plugin.requestPermissions()
      } catch (error) {
        console.warn('[Camera:native] requestPermissions failed:', error)
      }
    }
  }

  if (plugin || typeof api?.takePicture === 'function') {
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
  // اگر پیش‌نمایش زنده فعال است، همان فریم را بگیر (مثل وب)
  try {
    return await webCamera.capturePhoto(options)
  } catch (_) {
    // ادامه با Intent / پلاگین
  }

  const api = getNativeApi()
  if (typeof api?.takePicture === 'function') {
    const result = await api.takePicture()
    const dataUrl = normalizeDataUrl(result?.dataUrl || result?.base64 || result)
    if (!dataUrl) {
      throw new Error('خروجی عکس از لایهٔ native معتبر نبود.')
    }
    return { dataUrl }
  }

  const plugin = resolveCameraPlugin()
  if (!plugin?.getPhoto) {
    throw new Error('پیش‌نمایش دوربین فعال نیست و دوربین سیستم هم در دسترس نیست.')
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
