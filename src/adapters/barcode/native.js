/**
 * Barcode — native (ViewApp WebView)
 *
 * پیش‌نمایش زنده با getUserMedia + تشخیص با BarcodeDetector.
 * اجازهٔ دوربین از shell (openCamera / onPermissionRequest) گرفته می‌شود.
 */

import { viewAppBridge } from '@settings/capacitor/bridge.js'
import { barcodeSettings } from '@settings/barcode/defaults.js'

/** @type {MediaStream | null} */
let activeStream = null
/** @type {BarcodeDetector | null} */
let detector = null
/** @type {ReturnType<typeof setTimeout> | null} */
let detectTimer = null
/** @type {HTMLVideoElement | null} */
let boundVideo = null
/** @type {((result: { rawValue: string, format: string }) => void) | null} */
let onDetectedCallback = null
let scanning = false

function getNativeApi() {
  try {
    return window[viewAppBridge.nativeApi] || null
  } catch (_) {
    return null
  }
}

function hasBarcodeDetector() {
  return typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function'
}

export async function isBarcodeSupported() {
  return hasBarcodeDetector() || Boolean(navigator?.mediaDevices?.getUserMedia)
}

export function getBarcodeProviderLabel() {
  return 'native'
}

function stopDetectLoop() {
  if (detectTimer != null) {
    clearTimeout(detectTimer)
    detectTimer = null
  }
}

function stopTracks() {
  if (!activeStream) return
  activeStream.getTracks().forEach((track) => {
    try {
      track.stop()
    } catch (_) {
      // ignore
    }
  })
  activeStream = null
}

async function ensureDetector() {
  if (detector) return detector
  if (!hasBarcodeDetector()) {
    throw new Error('این دستگاه از تشخیص بارکد پشتیبانی نمی‌کند.')
  }

  try {
    detector = new window.BarcodeDetector({ formats: barcodeSettings.formats })
  } catch (_) {
    detector = new window.BarcodeDetector()
  }
  return detector
}

async function warmUpNativeCameraPermission() {
  const api = getNativeApi()
  if (typeof api?.openCamera !== 'function') return
  try {
    await api.openCamera()
  } catch (error) {
    console.warn('[Barcode:native] openCamera permission warm-up failed:', error)
  }
}

async function runDetectOnce() {
  if (!scanning || !boundVideo || !detector) return

  try {
    if (boundVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const codes = await detector.detect(boundVideo)
      if (codes?.length && onDetectedCallback) {
        const first = codes[0]
        onDetectedCallback({
          rawValue: String(first.rawValue || ''),
          format: String(first.format || 'unknown'),
        })
      }
    }
  } catch (error) {
    console.warn('[Barcode:native] detect failed:', error)
  }

  if (!scanning) return
  detectTimer = setTimeout(() => {
    runDetectOnce()
  }, barcodeSettings.detectIntervalMs)
}

/**
 * @param {{
 *   videoElement?: HTMLVideoElement,
 *   onDetected?: (result: { rawValue: string, format: string }) => void
 * }} [options]
 */
export async function startBarcodeScan(options = {}) {
  const { videoElement, onDetected } = options
  if (!videoElement) {
    throw new Error('عنصر ویدیو برای پیش‌نمایش بارکدخوان لازم است.')
  }
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('دسترسی به دوربین در این محیط در دسترس نیست.')
  }

  await stopBarcodeScan({ videoElement })
  await warmUpNativeCameraPermission()
  await ensureDetector()

  try {
    activeStream = await navigator.mediaDevices.getUserMedia(barcodeSettings.constraints)
  } catch (error) {
    const name = error?.name || ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      throw new Error('اجازهٔ دسترسی به دوربین برای بارکدخوان داده نشد.')
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      throw new Error('دوربینی روی این دستگاه پیدا نشد.')
    }
    throw new Error(error?.message || 'باز کردن بارکدخوان ناموفق بود.')
  }

  boundVideo = videoElement
  onDetectedCallback = typeof onDetected === 'function' ? onDetected : null
  videoElement.srcObject = activeStream
  videoElement.muted = true
  videoElement.playsInline = true
  await videoElement.play().catch(() => {})

  scanning = true
  runDetectOnce()

  return { mode: 'stream' }
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [options]
 */
export async function stopBarcodeScan(options = {}) {
  scanning = false
  stopDetectLoop()
  onDetectedCallback = null
  detector = null

  const api = getNativeApi()
  if (typeof api?.closeCamera === 'function') {
    try {
      await api.closeCamera()
    } catch (_) {
      // ignore
    }
  }

  stopTracks()
  const videoElement = options.videoElement || boundVideo
  if (videoElement) {
    videoElement.srcObject = null
  }
  boundVideo = null
}

/**
 * @param {{
 *   videoElement?: HTMLVideoElement,
 *   onDetected?: (result: { rawValue: string, format: string }) => void
 * }} [options]
 */
export async function resetBarcodeScan(options = {}) {
  await stopBarcodeScan(options)
  return startBarcodeScan(options)
}
