/**
 * نمای یکپارچهٔ Camera — انتخاب provider بر اساس محیط اجرا
 */

import { isNativePlatform } from '@/platform/env'
import * as nativeCamera from './native'
import * as webCamera from './web'

function provider() {
  return isNativePlatform() ? nativeCamera : webCamera
}

export function isCameraSupported() {
  return provider().isCameraSupported()
}

export function openCamera(options) {
  return provider().openCamera(options)
}

export function resetCamera(options) {
  return provider().resetCamera(options)
}

export function closeCamera(options) {
  return provider().closeCamera(options)
}

export function capturePhoto(options) {
  return provider().capturePhoto(options)
}

export function getCameraProviderLabel() {
  return provider().getCameraProviderLabel()
}
