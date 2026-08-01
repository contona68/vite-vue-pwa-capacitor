/**
 * Camera — وب (MediaDevices.getUserMedia + canvas)
 */

import { cameraSettings } from '@settings/camera/defaults.js'

/** @type {MediaStream | null} */
let activeStream = null

export async function isCameraSupported() {
  return Boolean(navigator?.mediaDevices?.getUserMedia)
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

/**
 * باز کردن دوربین و اتصال به video element
 * @param {{ videoElement: HTMLVideoElement }} options
 */
export async function openCamera({ videoElement } = {}) {
  if (!videoElement) {
    throw new Error('عنصر ویدیو برای پیش‌نمایش دوربین لازم است.')
  }
  if (!(await isCameraSupported())) {
    throw new Error('این مرورگر از دسترسی به دوربین پشتیبانی نمی‌کند.')
  }

  stopTracks()

  try {
    activeStream = await navigator.mediaDevices.getUserMedia(cameraSettings.constraints)
  } catch (error) {
    const name = error?.name || ''
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      throw new Error('دسترسی به دوربین رد شد. از تنظیمات مرورگر اجازه بدهید.')
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      throw new Error('دوربینی روی این دستگاه پیدا نشد.')
    }
    throw new Error(error?.message || 'باز کردن دوربین ناموفق بود.')
  }

  videoElement.srcObject = activeStream
  videoElement.muted = true
  videoElement.playsInline = true
  await videoElement.play().catch(() => {})

  return { mode: 'stream' }
}

/** بستن و دوباره باز کردن استریم */
export async function resetCamera(options) {
  await closeCamera(options)
  return openCamera(options)
}

/**
 * @param {{ videoElement?: HTMLVideoElement }} [options]
 */
export async function closeCamera({ videoElement } = {}) {
  stopTracks()
  if (videoElement) {
    videoElement.srcObject = null
  }
}

/**
 * گرفتن فریم فعلی از پیش‌نمایش
 * @param {{ videoElement: HTMLVideoElement }} options
 * @returns {Promise<{ dataUrl: string }>}
 */
export async function capturePhoto({ videoElement } = {}) {
  if (!videoElement || !activeStream) {
    throw new Error('ابتدا دوربین را باز کنید.')
  }

  const width = videoElement.videoWidth || 640
  const height = videoElement.videoHeight || 480
  if (!width || !height) {
    throw new Error('پیش‌نمایش دوربین هنوز آماده نیست.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('امکان ثبت تصویر وجود ندارد.')
  }
  ctx.drawImage(videoElement, 0, 0, width, height)

  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92) }
}

export function getCameraProviderLabel() {
  return 'web'
}
