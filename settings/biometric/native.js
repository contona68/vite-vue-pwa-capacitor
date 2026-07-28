/**
 * تنظیمات بیومتریک Capacitor (مسیر native)
 * نام پلاگین‌ها به‌ترتیب اولویت جستجو می‌شوند.
 */
export const biometricNativeSettings = {
  pluginNames: ['NativeBiometric', 'BiometricAuth', 'FingerprintAIO'],
  prompt: {
    reason: 'ورود به هایپریک',
    title: 'احراز هویت',
    subtitle: 'اثرانگشت یا قفل دستگاه',
    description: 'برای باز کردن برنامه تأیید کنید',
    negativeButtonText: 'لغو',
    maxAttempts: 5,
  },
}
