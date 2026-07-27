<template>
  <main class="page">
    <AppNav />
    <section class="content">
      <h1 id="settings-title">تنظیمات</h1>

      <form class="settings-form" @submit.prevent="onSave">
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success" role="status">{{ successMessage }}</p>

        <ul class="feature-list">
          <li v-for="item in featureItems" :key="item.key">
            <div class="feature-text">
              <strong>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
            </div>
            <label class="switch">
              <input
                type="checkbox"
                :checked="draftFeatures[item.key]"
                :disabled="saving"
                @change="onFeatureToggle(item.key, $event.target.checked)"
              />
              <span class="slider" />
            </label>
          </li>

          <li v-if="canShowAppLockToggle">
            <div class="feature-text">
              <strong>قفل اثرانگشت</strong>
              <span>
                ترجیح حساب؛ روی دستگاه‌هایی که اثرانگشت دارند، هنگام باز کردن برنامه درخواست می‌شود.
              </span>
            </div>
            <label class="switch">
              <input
                type="checkbox"
                :checked="draftAppLockEnabled"
                :disabled="saving"
                @change="onAppLockToggle($event.target.checked)"
              />
              <span class="slider" />
            </label>
          </li>
        </ul>

        <div class="actions">
          <button type="button" class="btn ghost" :disabled="saving" @click="onReset">
            بازگشت به پیش‌فرض
          </button>
          <button type="submit" class="btn primary" :disabled="saving || !dirty">
            {{ saving ? 'در حال ذخیره...' : 'ذخیره' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppNav from '@/components/AppNav.vue'
import {
  appConfig,
  isFeatureEnabled,
  resetAppConfig,
  updateFeatureFlags,
} from '@/services/appConfig.service'
import {
  disableAppLock,
  enableAppLock,
  checkAppLockSettingEnabled,
} from '@/utils/appLock'
import { getTokenUsername } from '@/utils/auth'

const featureItems = [
  {
    key: 'installBanner',
    title: 'پیشنهاد نصب برنامه',
    description: 'اگر برنامه روی گوشی نصب نباشد، پیام نصب را نشان بده.',
  },
  {
    key: 'updateBanner',
    title: 'اطلاع نسخه جدید',
    description: 'وقتی نسخه تازه‌ای آماده باشد، پیام بروزرسانی را نشان بده.',
  },
  {
    key: 'connectivityIndicator',
    title: 'وضعیت اینترنت',
    description: 'در صفحه ورود، آنلاین یا آفلاین بودن را نشان بده.',
  },
  {
    key: 'otp',
    title: 'ورود دو مرحله‌ای',
    description: 'بعد از نام کاربری و رمز، از کد پیامک ارسالی هم استفاده می‌شود.',
  },
]

const draftFeatures = reactive({})
const draftAppLockEnabled = ref(false)
const dirty = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const sourceFeatures = computed(() => appConfig.value.features)

const canShowAppLockToggle = computed(() => isFeatureEnabled('appLock'))

function syncDraftFromConfig() {
  featureItems.forEach(({ key }) => {
    draftFeatures[key] = Boolean(sourceFeatures.value?.[key])
  })
  draftAppLockEnabled.value = checkAppLockSettingEnabled(getTokenUsername())
  dirty.value = false
}

function onFeatureToggle(key, checked) {
  draftFeatures[key] = checked
  dirty.value = true
  successMessage.value = ''
}

function onAppLockToggle(checked) {
  draftAppLockEnabled.value = checked
  dirty.value = true
  successMessage.value = ''
}

async function onSave() {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true

  try {
    const featuresPatch = {}
    featureItems.forEach(({ key }) => {
      featuresPatch[key] = Boolean(draftFeatures[key])
    })
    await updateFeatureFlags(featuresPatch)

    if (canShowAppLockToggle.value) {
      if (draftAppLockEnabled.value) {
        const username = getTokenUsername()
        if (!username) {
          throw new Error('برای فعال‌سازی قفل باید وارد حساب شده باشید.')
        }
        enableAppLock(username)
      } else {
        disableAppLock()
      }
    }

    dirty.value = false
    successMessage.value = 'تنظیمات ذخیره شد.'
  } catch (error) {
    errorMessage.value = error?.message || 'ذخیره تنظیمات ناموفق بود.'
  } finally {
    saving.value = false
  }
}

async function onReset() {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    await resetAppConfig()
    disableAppLock()
    syncDraftFromConfig()
    successMessage.value = 'تنظیمات به حالت پیش‌فرض برگشت.'
  } catch (error) {
    errorMessage.value = error?.message || 'بازنشانی ناموفق بود.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  syncDraftFromConfig()
})

watch(sourceFeatures, () => {
  if (!dirty.value) syncDraftFromConfig()
})
</script>

<style scoped>
.page {
  min-height: 100dvh;
  background: #f1f5f9;
}

.content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0.85rem 0.85rem 1rem;
}

h1 {
  margin: 0 0 0.55rem;
  color: #0f172a;
  font-size: 1.2rem;
}

.settings-form {
  display: grid;
  gap: 0.55rem;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}

.feature-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.55rem;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.feature-text {
  display: grid;
  gap: 0.05rem;
  min-width: 0;
}

.feature-text strong {
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.25;
}

.feature-text span {
  color: #64748b;
  font-size: 0.72rem;
  line-height: 1.3;
}

.switch {
  position: relative;
  width: 40px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  transition: 0.2s ease;
}

.slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #fff;
  transition: 0.2s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
}

.switch input:checked + .slider {
  background: #0ea5e9;
}

.switch input:checked + .slider::before {
  transform: translateX(16px);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}

.btn {
  border: 0;
  border-radius: 0.55rem;
  padding: 0.45rem 0.9rem;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #0ea5e9;
  color: #fff;
}

.btn.ghost {
  background: #fff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #be123c;
  font-size: 0.8rem;
}

.success {
  margin: 0;
  color: #15803d;
  font-size: 0.8rem;
}
</style>
