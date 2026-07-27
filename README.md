# هایپریک — Vite + Vue 3 + PWA (+ Capacitor-ready)

کپی از پروژه وب [vite-vue-pwa](https://github.com/contona68/vite-vue-pwa) برای توسعهٔ مشترک با لایهٔ Capacitor.
ریپوی اصلی بدون تغییر مانده است.

## معماری محیط (Web / Native)

تنظیمات و ابزارها خارج از کامپوننت‌اند:

| مسیر | نقش |
|------|-----|
| `src/platform/` | تشخیص `isNative` / پلتفرم |
| `src/config/platform.defaults.js` | سیاست PWA / SMS / biometric / splash |
| `src/services/platform.service.js` | اعمال سیاست روی کانفیگ |
| `src/adapters/sms` | خواندن OTP (WebOTP یا Capacitor/Bridge) |
| `src/adapters/biometric` | اثرانگشت (WebAuthn یا پلاگین native) |
| `src/adapters/splash` | اسپلش وب یا Capacitor SplashScreen |
| `src/adapters/bridge.js` | پل `ViewAppOtp.receive` و رویدادها |

در محیط native: Service Worker، بنر نصب و آپدیت PWA خاموش می‌شوند.

## اجرای محلی

```bash
npm run dev
npm run mobile
```

نصب پکیج محلی با میرور لیارا (بدون تغییر `.npmrc`):

```bash
npm install --registry=https://package-mirror.liara.ir/repository/npm/
```

## انتشار روی GitHub Pages

1. کد را push کن روی `main`
2. در GitHub برو به:
   **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. بعد از سبز شدن workflow:

`https://USERNAME.github.io/vite-vue-pwa-capacitor/login`

### بیلد دستی برای Pages

```bash
# Windows PowerShell
$env:VITE_BASE_PATH="/vite-vue-pwa-capacitor/"; npm run build:gh
```
