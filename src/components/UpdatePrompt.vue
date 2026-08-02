<template>
  <Teleport to="body">
    <Transition name="banner">
      <aside
        v-if="visible"
        class="update-banner"
        role="dialog"
        aria-labelledby="update-title"
      >
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
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { applyPwaUpdate, dismissPwaUpdate, needRefresh } from '@/pwa/updateState'
import { appConfig } from '@/services/appConfig.service'
import { isPwaCapabilityEnabled } from '@/services/platform.service'
import { APP_ICON_192 } from '@/utils/publicUrl'

const appIcon = APP_ICON_192
const pwaUi = computed(() => appConfig.value.pwaUi)
/** بنر آپدیت: فقط سیاست محیط + وجود آپدیت واقعی — بدون تنظیمات کاربر */
const visible = computed(
  () => Boolean(needRefresh.value) && isPwaCapabilityEnabled('updateBanner'),
)

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
  z-index: 10050;
  inset-inline: 24px;
  top: max(24px, env(safe-area-inset-top, 0px));
  bottom: auto;
  left: 24px;
  right: 24px;
  width: auto;
  max-width: none;
  margin-inline: 0;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: #ffffff;
  color: #7c2d12;
  border: 1px solid #fde68a;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  pointer-events: auto;
}

.app-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: transparent;
  object-fit: contain;
}

.text {
  flex: 1 1 160px;
  min-width: 0;
}

.text strong {
  display: block;
  margin-bottom: 0.2rem;
  color: #7c2d12;
  font-size: 0.98rem;
}

.text p {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 0.45rem;
  margin-inline-start: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  border: 0;
  border-radius: 0.7rem;
  padding: 0.55rem 0.9rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #f29220;
  color: #ffffff;
}

.btn.ghost {
  background: #fff4e8;
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
  transform: translateY(-12px);
}
</style>
