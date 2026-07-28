# منبع امکانات بر اساس محیط لود

## قاعده

| محیط لود | منبع امکانات |
|---|---|
| وب / مرورگر / PWA | **همه چیز از وب** (API مرورگر و خود اپ) |
| Capacitor / ViewApp | **بخشی از لایه بالا (native/shell)** و **بخشی همچنان از وب** |

تشخیص محیط: `isNativePlatform()`  
سیاست: `settings/capacitor/policies.js`

---

## جدول منبع فیچر

| فیچر | اگر فقط در وب لود شود | اگر داخل Capacitor لود شود | در Capacitor نیاز از کجا تأمین می‌شود؟ |
|---|---|---|---|
| تشخیص محیط | وب | لایه بالا | Capacitor shim / `window.Capacitor` |
| آنلاین / آفلاین | وب (`navigator.onLine`) | لایه بالا | `viewapp:connectivity` / `ViewAppConnectivity` |
| UI آفلاین (پیام داخل صفحه) | وب | لایه بالا (UI وب خاموش) | overlay آفلاین ViewApp |
| OTP از SMS | وب (WebOTP) | لایه بالا | `ViewAppOtp` / SMS native / `viewapp:otp-received` |
| بیومتریک / اثرانگشت | وب (WebAuthn) | لایه بالا | پلاگین Capacitor |
| Splash بوت | وب (HTML) | لایه بالا | `SplashScreen` + دستور hide از وب |
| بک سخت‌افزاری / سیستم | — (وجود ندارد) | لایه بالا | `viewapp:back` / `ViewAppNav` / `App.backButton` |
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
- **لود در Capacitor:** شبکه، OTP، بیومتریک، splash، بک سیستم و تنظیمات WebView از **لایه بالا**؛ خود UI اپ، روتینگ و کش لاگین از **وب** داخل WebView.
