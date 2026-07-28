<template>
  <div class="app-shell">
    <!-- فقط وب: بنر آپدیت؛ در Capacitor خاموش است -->
    <UpdatePrompt v-if="showUpdateBanner" />
    <!-- فقط وب: بنر نصب؛ همیشه mount بماند تا BIP از دست نرود -->
    <InstallPrompt v-if="showInstallBanner" />
    <RouterView />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import InstallPrompt from '@/components/InstallPrompt.vue'
import UpdatePrompt from '@/components/UpdatePrompt.vue'
import { isFeatureEnabled } from '@/services/appConfig.service'
import { isPwaCapabilityEnabled } from '@/services/platform.service'

const showUpdateBanner = computed(
  () => isFeatureEnabled('updateBanner') && isPwaCapabilityEnabled('updateBanner'),
)
const showInstallBanner = computed(
  () => isFeatureEnabled('installBanner') && isPwaCapabilityEnabled('installBanner'),
)
</script>
