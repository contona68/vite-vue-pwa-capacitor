import { brandingDefaults } from '../branding/defaults.js'
import { connectivityDefaults } from '../connectivity/defaults.js'
import { featuresDefaults } from '../features/defaults.js'
import { webPlatformPolicy } from '../capacitor/policies.js'
import { pwaUiDefaults } from '../pwa/ui.defaults.js'

/** کانفیگ پیش‌فرض کامل اپ (قابل override از API/localStorage) */
export function createDefaultAppConfig() {
  return {
    features: { ...featuresDefaults },
    branding: { ...brandingDefaults },
    pwaUi: { ...pwaUiDefaults },
    connectivity: { ...connectivityDefaults },
    /** snapshot محیط — در runtime توسط platform.service تکمیل می‌شود */
    platform: {
      mode: webPlatformPolicy.mode,
      runtime: 'web',
      smsProvider: webPlatformPolicy.sms.provider,
      biometricProvider: webPlatformPolicy.biometric.provider,
      connectivityProvider: webPlatformPolicy.connectivity.provider,
      navigationProvider: webPlatformPolicy.navigation.provider,
      cameraProvider: webPlatformPolicy.camera.provider,
      locationProvider: webPlatformPolicy.location.provider,
      pwa: { ...webPlatformPolicy.pwa },
    },
  }
}
