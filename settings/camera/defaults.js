/**
 * تنظیمات دوربین — مشترک وب و native
 */
export const cameraSettings = {
  /** محدودیت استریم وب / WebView */
  constraints: {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  /** نام پلاگین Capacitor Camera */
  pluginNames: ['Camera'],
  /** کیفیت عکس native (۰–۱۰۰) */
  nativeQuality: 90,
}
