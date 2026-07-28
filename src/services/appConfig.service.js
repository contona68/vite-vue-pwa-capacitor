import { computed, ref } from 'vue'
import { apiFetchAppConfig, apiResetAppConfig, apiUpdateAppConfig } from '@/api/appConfigApi'
import { createDefaultAppConfig } from '@settings/app'
import { applyPlatformPolicyToConfig } from '@/services/platform.service'

const configState = ref(createDefaultAppConfig())

export const appConfig = computed(() => configState.value)

export function isFeatureEnabled(featureKey) {
  return Boolean(configState.value?.features?.[featureKey])
}

function commitConfig(nextConfig) {
  configState.value = applyPlatformPolicyToConfig(nextConfig)
  return configState.value
}

export async function loadAppConfig() {
  const fetched = await apiFetchAppConfig()
  return commitConfig(fetched)
}

export async function updateFeatureFlags(featuresPatch) {
  const updated = await apiUpdateAppConfig({ features: featuresPatch })
  return commitConfig(updated)
}

export async function resetAppConfig() {
  const reset = await apiResetAppConfig()
  return commitConfig(reset)
}

export function applySplashFromConfig() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return
  const title = splash.querySelector('p')
  if (title) {
    title.textContent = configState.value.branding.splashMessage || ''
  }
}
