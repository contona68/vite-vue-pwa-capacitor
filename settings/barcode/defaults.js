/** تنظیمات بارکدخوان — مشترک وب و native */
export const barcodeSettings = {
  /** محدودیت استریم دوربین برای اسکن */
  constraints: {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  /** فاصلهٔ بین تلاش‌های تشخیص (ms) */
  detectIntervalMs: 250,
  /**
   * فرمت‌های BarcodeDetector (در صورت پشتیبانی مرورگر/WebView)
   * @type {string[]}
   */
  formats: [
    'qr_code',
    'ean_13',
    'ean_8',
    'code_128',
    'code_39',
    'upc_a',
    'upc_e',
    'itf',
    'data_matrix',
  ],
}
