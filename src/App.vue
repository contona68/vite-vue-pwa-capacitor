<template>
  <div class="app-shell">
    <UpdatePrompt />
    <InstallPrompt v-if="showInstallBanner" />
    <RouterView />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import InstallPrompt from '@/components/InstallPrompt.vue'
import UpdatePrompt from '@/components/UpdatePrompt.vue'
import { isPwaCapabilityEnabled } from '@/services/platform.service'

/** بنر نصب: فقط سیاست محیط (وب روشن / native خاموش) — بدون تنظیمات کاربر */
const showInstallBanner = computed(() => isPwaCapabilityEnabled('installBanner'))
</script>
