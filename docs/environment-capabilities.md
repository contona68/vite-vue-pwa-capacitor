# منبع امکانات بر اساس محیط لود

هم‌راستا با قرارداد bridge در پروژهٔ `app-capacitor`
(`ViewAppNative` / رویدادهای `viewapp:*`).

## قاعده

| محیط لود | منبع امکانات |
|---|---|
| وب / مرورگر / PWA | **همه چیز از وب** (API مرورگر و خود اپ) |
| Capacitor / ViewApp | **وضعیت/قابلیت دستگاه از لایه بالا**؛ **UI و روتینگ از وب** |

تشخیص محیط: `isNativePlatform()`  
سیاست: `settings/capacitor/policies.js`  
پل: `settings/capacitor/bridge.js`

---

## جدول منبع فیچر

| فیچر | اگر فقط در وب لود شود | اگر داخل Capacitor لود شود | در Capacitor نیاز از کجا تأمین می‌شود؟ |
|---|---|---|---|
| تشخیص محیط | وب | لایه بالا | Capacitor shim / `__VIEWAPP_NATIVE__` |
| آنلاین / آفلاین (وضعیت) | وب (`navigator.onLine`) | لایه بالا | `viewapp:connectivity` + `ViewAppNative.getConnectivity()` |
| VPN (وضعیت) | — | لایه بالا | `vpnActive` در connectivity / `viewapp:vpn` / بنر native |
| UI آفلاین داخل صفحه | وب | **وب** | پیام/آیکون لاگین (native فقط notify می‌کند) |
| OTP از SMS | وب (WebOTP) | لایه بالا | `ViewAppOtp` / `viewapp:otp-received` / `ViewAppNative.startSmsListen` |
| بیومتریک / اثرانگشت | وب (WebAuthn) | لایه بالا | پلاگین Capacitor (`NativeBiometric` و…) |
| Splash بوت | وب (HTML) | لایه بالا | `SplashScreen.hide` / `ViewAppNative.hideSplash` |
| بک سخت‌افزاری / سیستم | — | لایه بالا (WebView) | فعلاً `WebView.goBack()`؛ `viewapp:back` اختیاری |
| لود URL WebView | — | لایه بالا | کانفیگ ViewApp / APK |
| Pull-to-Refresh | — | لایه بالا | تنظیمات ViewApp |
| whitelist / UA / cache / zoom | — | لایه بالا | تنظیمات WebView |
| کش آفلاین صفحه لاگین | وب (Service Worker) | **وب** | همان SW داخل WebView (فقط `/login`) |
| روتینگ و صفحات Vue | وب | **وب** | Vue Router داخل اپ |
| دکمه بک داخل UI اپ | وب | **وب** | `router.back()` در خود اپ |
| فرم لاگین / OTP / تنظیمات | وب | **وب** | کامپوننت‌های Vue |
| بنر نصب PWA | وب | خاموش | استفاده نمی‌شود |
| بنر آپدیت PWA | وب | خاموش | استفاده نمی‌شود |

---

## خلاصه یک‌خطی

- **لود در مرورگر:** همه نیازها از وب.
- **لود در Capacitor:** شبکه/OTP/بیومتریک/splash از **لایه بالا**؛ UI آفلاین، روتینگ، دکمه بک داخل اپ و کش لاگین از **وب**.
