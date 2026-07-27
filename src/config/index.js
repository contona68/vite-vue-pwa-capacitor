import { brandingDefaults } from './branding.defaults'
import { connectivityDefaults } from './connectivity.defaults'
import { featuresDefaults } from './features.defaults'
import { webPlatformPolicy } from './platform.defaults'
import { pwaUiDefaults } from './pwaUi.defaults'

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
      pwa: { ...webPlatformPolicy.pwa },
    },
  }
}
