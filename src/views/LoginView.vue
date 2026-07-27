<template>
  <main class="page login-page">
    <div v-if="showConnectivity" class="connection-bar" aria-live="polite">
      <span
        class="wifi-icon"
        :class="{ offline: !isOnline }"
        :title="isOnline ? 'آنلاین' : 'آفلاین'"
        :aria-label="isOnline ? 'اتصال اینترنت برقرار است' : 'اتصال اینترنت قطع است'"
      >
        <svg v-if="isOnline" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path d="M12 18.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor" />
          <path
            d="M8.5 14.2a5.2 5.2 0 0 1 7 0M5.5 11a9.2 9.2 0 0 1 13 0M2.8 7.8a13.2 13.2 0 0 1 18.4 0"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path d="M12 18.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor" />
          <path
            d="M8.5 14.2a5.2 5.2 0 0 1 7 0M5.5 11c1.2-1.1 2.7-1.9 4.3-2.3M18.5 11c-.7-.6-1.5-1.1-2.3-1.5M2.8 7.8c1.4-1.2 3-2.1 4.7-2.7M21.2 7.8c-1.2-1-2.5-1.8-4-2.3M4 4l16 16"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <p v-if="!isOnline" class="offline-message">{{ offlineMessage }}</p>
    </div>

    <section class="login-card" aria-labelledby="login-title">
      <div class="brand">
        <img :src="appIcon" alt="لوگوی اپ" width="64" height="64" />
        <h1 id="login-title">{{ showUnlockUi ? 'باز کردن برنامه' : 'ورود به حساب' }}</h1>
        <p v-if="showUnlockUi" class="subtitle">
          اثرانگشت را تأیید کنید. اگر پنجره بسته شد، روی آیکون بزنید.
        </p>
      </div>

      <div v-if="showUnlockUi" class="unlock-block">
        <button
          v-if="!isUnlocking"
          type="button"
          class="fingerprint-btn"
          aria-label="باز کردن با اثرانگشت"
          @click="onUnlock"
        >
          <svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true" fill="none">
            <path
              d="M12 2.5c-3.2 0-5.8 2.5-5.8 5.6v1.1M6.2 11.2c0 4.7 2.4 8.8 5.8 10.3 3.4-1.5 5.8-5.6 5.8-10.3M12 6.2c-1.7 0-3.1 1.3-3.1 3v2.2M8.9 12.1c.3 3.1 1.7 5.8 3.1 6.9 1.4-1.1 2.8-3.8 3.1-6.9M12 10.4v3.2"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <div v-else class="loading-wrap">
          <div class="spinner" aria-hidden="true" />
          <p>{{ unlockStatus }}</p>
        </div>
        <button type="button" class="skip-link" :disabled="isUnlocking" @click="usePasswordInstead">
          ورود با نام کاربری و رمز
        </button>
      </div>

      <form
        v-else-if="!showNoBiometricModal && !isResolvingGate"
        class="login-form"
        @submit.prevent="onSubmit"
      >
        <label class="field">
          <span>نام کاربری</span>
          <input
            v-model.trim="username"
            type="text"
            name="username"
            autocomplete="username"
            placeholder="مثلاً admin"
            required
          />
        </label>

        <label class="field">
          <span>رمز عبور</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
        </label>

        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

        <button class="btn primary" type="submit" :disabled="isSubmitting || !isOnline">
          {{ isSubmitting ? 'در حال ورود...' : 'ورود' }}
        </button>
      </form>

      <p v-if="showUnlockUi && errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>

    <div
      v-if="showNoBiometricModal"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-bio-title"
    >
      <div class="modal-card">
        <h2 id="no-bio-title">اثرانگشت تعریف نشده</h2>
        <p>
          برای باز کردن برنامه با اثرانگشت، ابتدا از تنظیمات گوشی یک اثرانگشت ثبت کنید. سپس می‌توانید دوباره
          تلاش کنید.
        </p>
        <button type="button" class="btn primary" @click="usePasswordInstead">
          ورود با نام کاربری و رمز عبور
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  checkAppLockBiometricEnrolled,
  unlockWithBiometric,
} from '@/utils/appLock'
import {
  beginPendingLogin,
  isLoggedIn,
  isSessionUnlocked,
} from '@/utils/auth'
import { appConfig, isFeatureEnabled } from '@/services/appConfig.service'
import { useConnectivity } from '@/services/connectivity.service'
import { completeTokenLogin } from '@/services/login.service'
import {
  checkLoginByToken,
  openAuthenticatedSession,
  performLogout,
  shouldShowAppLockGate,
} from '@/services/session.service'
import { APP_ICON_192 } from '@/utils/publicUrl'

const appIcon = APP_ICON_192
const router = useRouter()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
const isUnlocking = ref(false)
const unlockStatus = ref('انگشت خود را روی حسگر قرار دهید...')
const forcePasswordForm = ref(false)
const showUnlockUi = ref(false)
const showNoBiometricModal = ref(false)
const isResolvingGate = ref(true)
const { isOnline } = useConnectivity()

const showConnectivity = computed(() => isFeatureEnabled('connectivityIndicator'))
const offlineMessage = computed(() => appConfig.value.connectivity.offlineMessage)

watch(
  () => appConfig.value?.features?.appLock,
  (enabled) => {
    if (!enabled) {
      forcePasswordForm.value = false
      showNoBiometricModal.value = false
      showUnlockUi.value = false
    }
  },
)

watch(isOnline, async (online) => {
  if (online && isLoggedIn()) {
    await router.replace({ name: 'home' })
    return
  }
  if (online) {
    await prepareEntryFlow()
  } else {
    showNoBiometricModal.value = false
    showUnlockUi.value = false
  }
})

async function goHomeAuthenticated() {
  openAuthenticatedSession()
  await router.replace({ name: 'home' })
}

async function onSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    if (!isOnline.value) {
      errorMessage.value = 'برای ورود به اینترنت نیاز دارید.'
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!username.value || !password.value) {
      errorMessage.value = 'نام کاربری و رمز عبور الزامی است.'
      return
    }

    if (!isFeatureEnabled('otp')) {
      await completeTokenLogin(username.value, '')
      await router.replace({ name: 'home' })
      return
    }

    beginPendingLogin(username.value)
    await router.push({ name: 'otp' })
  } catch (error) {
    errorMessage.value = error?.message || 'ورود ناموفق بود.'
  } finally {
    isSubmitting.value = false
  }
}

function onUnlock() {
  if (isUnlocking.value || !showUnlockUi.value) return

  errorMessage.value = ''
  if (!isOnline.value) {
    errorMessage.value = 'برای باز کردن برنامه به اینترنت نیاز دارید.'
    return
  }

  const unlockPromise = unlockWithBiometric()
  isUnlocking.value = true
  unlockStatus.value = 'انگشت خود را روی حسگر قرار دهید...'

  unlockPromise
    .then(async () => {
      // اثرانگشت فقط قفل است؛ لاگین بودن با توکن چک می‌شود
      unlockStatus.value = 'در حال بررسی نشست...'
      const login = await checkLoginByToken()
      if (!login.ok) {
        showUnlockUi.value = false
        forcePasswordForm.value = true
        errorMessage.value =
          login.reason === 'expired'
            ? 'نشست منقضی شده است. دوباره وارد شوید.'
            : 'نشست معتبر نیست. دوباره وارد شوید.'
        return
      }
      await goHomeAuthenticated()
    })
    .catch((error) => {
      if (error?.name === 'NotAllowedError') {
        errorMessage.value = 'تأیید اثرانگشت انجام نشد. دوباره روی آیکون بزنید.'
      } else {
        errorMessage.value = error?.message || 'باز کردن برنامه ممکن نشد.'
      }
    })
    .finally(() => {
      isUnlocking.value = false
    })
}

function usePasswordInstead() {
  // معادل خروج از قفل و ورود مجدد با فرم
  showNoBiometricModal.value = false
  showUnlockUi.value = false
  performLogout()
  forcePasswordForm.value = true
  errorMessage.value = ''
}

async function triggerUnlockAutomatically() {
  if (!isOnline.value || !showUnlockUi.value || isUnlocking.value) return
  await nextTick()
  window.setTimeout(() => {
    if (isOnline.value && showUnlockUi.value && !isUnlocking.value) onUnlock()
  }, 120)
}

/**
 * توکن = لاگین پایدار
 * اثرانگشت = فقط قفل (اگر خروج نزده باشد و شرایط برقرار باشد)
 */
async function prepareEntryFlow() {
  isResolvingGate.value = true
  showNoBiometricModal.value = false
  showUnlockUi.value = false
  errorMessage.value = ''

  try {
    if (!isOnline.value || forcePasswordForm.value) {
      return
    }

    if (isLoggedIn()) {
      await router.replace({ name: 'home' })
      return
    }

    // هر بار وضعیت لاگین با توکن چک می‌شود
    const login = await checkLoginByToken()
    if (!login.ok) {
      // بدون توکن یا منقضی → فرم لاگین
      forcePasswordForm.value = true
      return
    }

    // توکن معتبر؛ اگر قبلاً در این نشست آنلاک شده → خانه
    if (isSessionUnlocked()) {
      await goHomeAuthenticated()
      return
    }

    // قفل اثرانگشت فقط وقتی شرایط باشد (خروج نزده = توکن هست)
    if (!shouldShowAppLockGate(login.username)) {
      await goHomeAuthenticated()
      return
    }

    // مرحله ۳ اختصاصی: اثرانگشت روی دستگاه ثبت شده؟
    const enrolled = await checkAppLockBiometricEnrolled()
    if (!enrolled) {
      showNoBiometricModal.value = true
      return
    }

    showUnlockUi.value = true
    await triggerUnlockAutomatically()
  } finally {
    isResolvingGate.value = false
  }
}

onMounted(async () => {
  document.documentElement.classList.add('login-no-scroll')
  await prepareEntryFlow()
})

onUnmounted(() => {
  document.documentElement.classList.remove('login-no-scroll')
})
</script>

<style scoped>
.login-page {
  position: relative;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 1rem;
  background:
    radial-gradient(ellipse at 20% 10%, rgba(56, 189, 248, 0.18), transparent 50%),
    radial-gradient(ellipse at 80% 90%, rgba(99, 102, 241, 0.16), transparent 45%),
    #0f172a;
}

.connection-bar {
  position: absolute;
  top: 0.75rem;
  inset-inline: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  z-index: 5;
  pointer-events: none;
}

.wifi-icon {
  color: #38bdf8;
  display: inline-flex;
}

.wifi-icon.offline {
  color: #f87171;
}

.offline-message {
  margin: 0;
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  padding-inline: 1rem;
}

.login-card {
  width: min(100%, 420px);
  padding: 1.5rem 1.25rem;
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.25);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
}

.brand {
  text-align: center;
  margin-bottom: 1.1rem;
}

.brand img {
  width: 56px;
  height: 56px;
  margin-bottom: 0.65rem;
  background: transparent;
}

.brand h1 {
  margin: 0;
  font-size: 1.45rem;
  color: #f8fafc;
}

.subtitle {
  margin: 0.45rem 0 0;
  color: #94a3b8;
  font-size: 0.88rem;
}

.unlock-block {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
}

.fingerprint-btn {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.45);
  background: rgba(14, 165, 233, 0.14);
  color: #7dd3fc;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.loading-wrap {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  color: #e0f2fe;
  font-weight: 600;
}

.spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid rgba(125, 211, 252, 0.25);
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

.skip-link {
  border: 0;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.login-form {
  display: grid;
  gap: 0.85rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.field input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.55);
  color: #f8fafc;
  border-radius: 0.75rem;
  padding: 0.7rem 0.85rem;
  font: inherit;
  outline: none;
}

.field input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #0f172a;
}

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error {
  margin: 0;
  color: #fda4af;
  font-size: 0.88rem;
  text-align: center;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(2, 6, 23, 0.65);
}

.modal-card {
  width: min(100%, 360px);
  padding: 1.15rem 1.1rem;
  border-radius: 1rem;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #e2e8f0;
  display: grid;
  gap: 0.75rem;
}

.modal-card h2 {
  margin: 0;
  font-size: 1.05rem;
  color: #f8fafc;
}

.modal-card p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #94a3b8;
}

.modal-card .btn {
  width: 100%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
