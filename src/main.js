import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { applySplashFromConfig, loadAppConfig } from './services/appConfig.service'
import { setupPwaRuntime } from './services/pwaRegister.service'
import {
  initPlatformRuntime,
  isPwaCapabilityEnabled,
} from './services/platform.service'
import { initConnectivityRuntime } from './services/connectivity.service'
import { initNavigationRuntime } from './services/navigation.service'
import { hideSplash, prepareSplash } from './adapters/splash'
import { startEarlyBeforeInstallPromptCapture } from './utils/pwaInstall'
import { attemptOpenNativeApp } from './utils/openNativeApp'
import './style.css'

async function bootstrap() {
  // قبل از mount: اگر اپ نصب باشد، از مرورگر اندروید به native برو
  if (attemptOpenNativeApp()) {
    return
  }

  await initPlatformRuntime()
  initConnectivityRuntime()
  initNavigationRuntime()
  prepareSplash()

  // BIP فقط در وب — در native بی‌معنا و تداخل‌زا است
  if (isPwaCapabilityEnabled('earlyInstallCapture')) {
    startEarlyBeforeInstallPromptCapture()
  }

  await loadAppConfig()
  applySplashFromConfig()
  await setupPwaRuntime()
  createApp(App).use(router).mount('#app')
  await hideSplash()
}

bootstrap()
