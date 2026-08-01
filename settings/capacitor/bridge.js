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
   * اختیاری — native فعلی viewapp:back / ViewAppNav ندارد؛
   * بک سخت‌افزاری معمولاً با WebView.goBack() انجام می‌شود.
   */
  navigationApi: 'ViewAppNav',
  backEvent: 'viewapp:back',

  /**
   * اختیاری — اگر shell متدهای دوربین را روی ViewAppNative بگذارد:
   * openCamera / closeCamera / takePicture
   */
  cameraMethods: {
    open: 'openCamera',
    close: 'closeCamera',
    capture: 'takePicture',
  },
}
