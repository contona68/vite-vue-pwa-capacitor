<template>
  <div class="app-shell">
    <!-- Teleport داخل خود کامپوننت؛ خارج از #app تا overflow لاگین نبردش -->
    <UpdatePrompt />
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

const showInstallBanner = computed(
  () => isFeatureEnabled('installBanner') && isPwaCapabilityEnabled('installBanner'),
)
</script>
