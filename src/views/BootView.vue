<template>
  <main class="page boot-page" aria-busy="true">
    <div class="boot-card">
      <div class="spinner" aria-hidden="true" />
      <p>{{ loadingText }}</p>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { appConfig } from '@/services/appConfig.service'
import { resolveBootRouteName } from '@/services/boot.service'

const router = useRouter()
const loadingText = computed(() => appConfig.value.branding.bootLoadingText)

onMounted(async () => {
  const routeName = await resolveBootRouteName()
  await router.replace({ name: routeName })
})
</script>

<style scoped>
.boot-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: #0f172a;
  color: #94a3b8;
}

.boot-card {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(148, 163, 184, 0.25);
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
