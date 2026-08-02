/**
 * قرارداد پل ViewApp ↔ وب
 * هم‌راستا با app-capacitor / ViewAppScriptInjector
 */
export const viewAppBridge = {
  /** API سطح‌بالای native */
  nativeApi: 'ViewAppNative',

  /** OTP */
  otpApi: 'ViewAppOtp',
  otpEvent: 'viewapp:otp-received',

  /** شبکه */
  connectivityEvent: 'viewapp:connectivity',
  vpnEvent: 'viewapp:vpn',

  /**
   * اختیاری — وب ممکن است برای تست expose کند؛
   * native فعلی ViewAppConnectivity را نصب نمی‌کند.
   */
  connectivityApi: 'ViewAppConnectivity',

  /**
   * بک سخت‌افزاری: shell رویداد viewapp:back می‌فرستد
   * (یا ViewAppNav.back را صدا می‌زند اگر expose شده باشد).
   */
  navigationApi: 'ViewAppNav',
  backEvent: 'viewapp:back',

  /**
   * دوربین سیستم روی ViewAppNative:
   * openCamera / closeCamera / takePicture → { dataUrl }
   */
  cameraMethods: {
    open: 'openCamera',
    close: 'closeCamera',
    capture: 'takePicture',
  },

  /** موقعیت مکانی: ViewAppNative.getLocation() → { latitude, longitude, accuracy } */
  locationMethod: 'getLocation',

  /** چاپ: ViewAppNative.print({ jobName }) → PrintManager */
  printMethod: 'print',

  /**
   * بارکدخوان: ViewAppNative.scanBarcode() → { rawValue, format }
   */
  barcodeMethod: 'scanBarcode',
}
