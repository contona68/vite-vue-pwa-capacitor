<template>
  <Transition name="banner">
    <aside v-if="needRefresh" class="update-banner" role="dialog" aria-labelledby="update-title">
      <img class="app-icon" :src="appIcon" alt="" width="48" height="48" />

      <div class="text">
        <strong id="update-title">{{ pwaUi.updateTitle }}</strong>
        <p>{{ pwaUi.updateBody }}</p>
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" @click="onDismiss">{{ pwaUi.updateDismiss }}</button>
        <button type="button" class="btn primary" @click="onUpdate">{{ pwaUi.updateAccept }}</button>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { applyPwaUpdate, dismissPwaUpdate, needRefresh } from '@/pwa/updateState'
import { appConfig } from '@/services/appConfig.service'
import { APP_ICON_192 } from '@/utils/publicUrl'

const appIcon = APP_ICON_192
const pwaUi = computed(() => appConfig.value.pwaUi)

function onUpdate() {
  applyPwaUpdate()
}

function onDismiss() {
  dismissPwaUpdate()
}
</script>

<style scoped>
.update-banner {
  position: fixed;
  z-index: 50;
  inset-inline: 1rem;
  bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: center;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #fde68a;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.app-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: transparent;
  object-fit: contain;
}

.text {
  flex: 1 1 200px;
  min-width: 0;
}

.text strong {
  display: block;
  margin-bottom: 0.2rem;
  color: #0f172a;
  font-size: 1rem;
}

.text p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.55;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-inline-start: auto;
}

.btn {
  border: 0;
  border-radius: 0.7rem;
  padding: 0.55rem 0.95rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #f29220;
  color: #ffffff;
}

.btn.ghost {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.28s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
