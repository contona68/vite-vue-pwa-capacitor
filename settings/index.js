/**
 * نقطهٔ ورود تنظیمات توسعه‌دهنده
 *
 * settings/
 *   pwa/          — Manifest، SW، بنر نصب/آپدیت
 *   biometric/    — WebAuthn، پلاگین native، قفل اپ
 *   capacitor/    — سیاست web/native و نام پلاگین‌ها
 *   branding/     — نام برند و متون اسپلش
 *   features/     — فلگ‌های فیچر
 *   connectivity/ — پیام آفلاین
 *   sms/          — OTP
 *   camera/       — دوربین وب / native
 *   location/     — موقعیت مکانی وب / native
 *   splash/       — اسپلش بوت
 *   print/        — پرینت پیش‌فرض (وب / native)
 *   app/          — کانفیگ تجمیعی و کلیدهای storage
 */

export * from './pwa/index.js'
export * from './biometric/index.js'
export * from './capacitor/index.js'
export * from './branding/index.js'
export * from './features/index.js'
export * from './connectivity/index.js'
export * from './sms/index.js'
export * from './camera/index.js'
export * from './location/index.js'
export * from './splash/index.js'
export * from './print/index.js'
export * from './app/index.js'
