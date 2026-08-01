/**
 * Barcode — native (ViewApp WebView)
 *
 * بدون لایبرری خارجی: getUserMedia + BarcodeDetector API.
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
/** @type {HTMLCanvasElement | null} */
let detectCanvas = null
/** @type {((result: { rawValue: string, format: string }) => void) | null} */
let onDetectedCallback = null
/** @type {string} */
let lastEmittedValue = ''
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
  return Boolean(navigator?.mediaDevices?.getUserMedia)
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
    throw new Error(
      'BarcodeDetector در این WebView فعال نیست. WebView یا Google Play Services را به‌روز کنید.',
    )
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

function grabVideoFrame(video) {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) return null

  if (!detectCanvas) {
    detectCanvas = document.createElement('canvas')
  }
  detectCanvas.width = width
  detectCanvas.height = height
  const ctx = detectCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, width, height)
  return detectCanvas
}

async function runDetectOnce() {
  if (!scanning || !boundVideo || !detector) return

  try {
    if (boundVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const frame = grabVideoFrame(boundVideo) || boundVideo
      const codes = await detector.detect(frame)
      const first = codes?.find((code) => code?.rawValue)
      if (first && onDetectedCallback) {
        const rawValue = String(first.rawValue)
        if (rawValue && rawValue !== lastEmittedValue) {
          lastEmittedValue = rawValue
          onDetectedCallback({
            rawValue,
            format: String(first.format || 'unknown'),
          })
        }
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
  lastEmittedValue = ''
  videoElement.srcObject = activeStream
  videoElement.muted = true
  videoElement.setAttribute('playsinline', 'true')
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
  lastEmittedValue = ''
  detectCanvas = null

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
