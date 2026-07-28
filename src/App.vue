<template>
  <div class="app-shell">
    <!-- همیشه mount؛ نمایش واقعی داخل خود کامپوننت با needRefresh است -->
    <UpdatePrompt />
    <!-- همیشه mount بماند تا beforeinstallprompt از دست نرود (حتی وقتی بنر آپدیت باز است) -->
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
