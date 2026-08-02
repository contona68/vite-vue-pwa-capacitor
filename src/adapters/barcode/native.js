/**
 * Barcode — native (ViewApp)
 *
 * بدون لایبرری JS: اسکنر native اندروید (Google Code Scanner).
 * اگر بریج نباشد، در صورت وجود به BarcodeDetector وب‌ویو برمی‌گردد.
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
/** @type {'native-scanner' | 'stream' | null} */
let activeMode = null

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
  const api = getNativeApi()
  if (typeof api?.scanBarcode === 'function') return true
  return Boolean(navigator?.mediaDevices?.getUserMedia && hasBarcodeDetector())
}

export function getBarcodeProviderLabel() {
  const api = getNativeApi()
  if (typeof api?.scanBarcode === 'function') return 'native-scanner'
  if (hasBarcodeDetector()) return 'BarcodeDetector'
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
    throw new Error('BarcodeDetector در این WebView فعال نیست.')
  }

  try {
    detector = new window.BarcodeDetector({ formats: barcodeSettings.formats })
  } catch (_) {
    detector = new window.BarcodeDetector()
  }
  return detector
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
  await stopBarcodeScan({ videoElement })

  const api = getNativeApi()
  if (typeof api?.scanBarcode === 'function') {
    activeMode = 'native-scanner'
    const result = await api.scanBarcode()
    if (result?.rawValue && typeof onDetected === 'function') {
      onDetected({
        rawValue: String(result.rawValue),
        format: String(result.format || 'unknown'),
      })
    }
    return { mode: 'native-scanner' }
  }

  if (!videoElement) {
    throw new Error('عنصر ویدیو برای پیش‌نمایش بارکدخوان لازم است.')
  }
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('دسترسی به دوربین در این محیط در دسترس نیست.')
  }

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

  activeMode = 'stream'
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
  activeMode = null

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
