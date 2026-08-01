<template>
  <main class="page login-page">
    <div v-if="showConnectivity" class="connection-bar" aria-live="polite">
      <span
        class="wifi-icon"
        :class="{ offline: !isOnline }"
        :title="isOnline ? 'Ø¢Ù†Ù„Ø§ÛŒÙ†' : 'Ø¢ÙÙ„Ø§ÛŒÙ†'"
        :aria-label="isOnline ? 'Ø§ØªØµØ§Ù„ Ø§ÛŒÙ†ØªØ±Ù†Øª Ø¨Ø±Ù‚Ø±Ø§Ø± Ø§Ø³Øª' : 'Ø§ØªØµØ§Ù„ Ø§ÛŒÙ†ØªØ±Ù†Øª Ù‚Ø·Ø¹ Ø§Ø³Øª'"
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
        <img :src="appIcon" alt="Ù„ÙˆÚ¯ÙˆÛŒ Ø§Ù¾" width="64" height="64" />
        <h1 id="login-title">{{ showUnlockUi ? 'Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ø¨Ø±Ù†Ø§Ù…Ù‡' : 'ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø­Ø³Ø§Ø¨' }}</h1>
        <p v-if="showUnlockUi" class="subtitle">
          Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª Ø±Ø§ ØªØ£ÛŒÛŒØ¯ Ú©Ù†ÛŒØ¯. Ø§Ú¯Ø± Ù¾Ù†Ø¬Ø±Ù‡ Ø¨Ø³ØªÙ‡ Ø´Ø¯ØŒ Ø±ÙˆÛŒ Ø¢ÛŒÚ©ÙˆÙ† Ø¨Ø²Ù†ÛŒØ¯.
        </p>
      </div>

      <div v-if="showUnlockUi" class="unlock-block">
        <button
          v-if="!isUnlocking"
          type="button"
          class="fingerprint-btn"
          aria-label="Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ø¨Ø§ Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª"
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
          ÙˆØ±ÙˆØ¯ Ø¨Ø§ Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ Ùˆ Ø±Ù…Ø²
        </button>
      </div>

      <form
        v-else-if="!showNoBiometricModal && !isResolvingGate"
        class="login-form"
        @submit.prevent="onSubmit"
      >
        <label class="field">
          <span>Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ</span>
          <input
            v-model.trim="username"
            type="text"
            name="username"
            autocomplete="username"
            placeholder="Ù…Ø«Ù„Ø§Ù‹ admin"
            required
          />
        </label>

        <label class="field">
          <span>Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            required
          />
        </label>

        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

        <button class="btn primary" type="submit" :disabled="isSubmitting || !isOnline">
          {{ isSubmitting ? 'Ø¯Ø± Ø­Ø§Ù„ ÙˆØ±ÙˆØ¯...' : 'ÙˆØ±ÙˆØ¯' }}
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
        <h2 id="no-bio-title">Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª ØªØ¹Ø±ÛŒÙ Ù†Ø´Ø¯Ù‡</h2>
        <p>
          Ø¨Ø±Ø§ÛŒ Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ø¨Ø±Ù†Ø§Ù…Ù‡ Ø¨Ø§ Ø§Ø«Ø±Ø§Ù†Ú¯Ø´ØªØŒ Ø§Ø¨ØªØ¯Ø§ Ø§Ø² ØªÙ†Ø¸ÛŒÙ…Ø§Øª Ú¯ÙˆØ´ÛŒ ÛŒÚ© Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª Ø«Ø¨Øª Ú©Ù†ÛŒØ¯. Ø³Ù¾Ø³ Ù…ÛŒâ€ŒØªÙˆØ§Ù†ÛŒØ¯ Ø¯ÙˆØ¨Ø§Ø±Ù‡
          ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.
        </p>
        <button type="button" class="btn primary" @click="usePasswordInstead">
          ÙˆØ±ÙˆØ¯ Ø¨Ø§ Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ Ùˆ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ±
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
import { useConnectivity, shouldShowWebConnectivityUi } from '@/services/connectivity.service'
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
const unlockStatus = ref('Ø§Ù†Ú¯Ø´Øª Ø®ÙˆØ¯ Ø±Ø§ Ø±ÙˆÛŒ Ø­Ø³Ú¯Ø± Ù‚Ø±Ø§Ø± Ø¯Ù‡ÛŒØ¯...')
const forcePasswordForm = ref(false)
const showUnlockUi = ref(false)
const showNoBiometricModal = ref(false)
const isResolvingGate = ref(true)
const { isOnline } = useConnectivity()

const showConnectivity = computed(
  () => shouldShowWebConnectivityUi() && isFeatureEnabled('connectivityIndicator'),
)
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
    await router.replace({ name: 'settings' })
    return
  }
  if (online) {
    await prepareEntryFlow()
  } else {
    showNoBiometricModal.value = false
    showUnlockUi.value = false
  }
})

async function goSettingsAuthenticated() {
  openAuthenticatedSession()
  await router.replace({ name: 'settings' })
}

async function onSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    if (!isOnline.value) {
      errorMessage.value = 'Ø¨Ø±Ø§ÛŒ ÙˆØ±ÙˆØ¯ Ø¨Ù‡ Ø§ÛŒÙ†ØªØ±Ù†Øª Ù†ÛŒØ§Ø² Ø¯Ø§Ø±ÛŒØ¯.'
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!username.value || !password.value) {
      errorMessage.value = 'Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ Ùˆ Ø±Ù…Ø² Ø¹Ø¨ÙˆØ± Ø§Ù„Ø²Ø§Ù…ÛŒ Ø§Ø³Øª.'
      return
    }

    if (!isFeatureEnabled('otp')) {
      await completeTokenLogin(username.value, '')
      await router.replace({ name: 'settings' })
      return
    }

    beginPendingLogin(username.value)
    await router.push({ name: 'otp' })
  } catch (error) {
    errorMessage.value = error?.message || 'ÙˆØ±ÙˆØ¯ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯.'
  } finally {
    isSubmitting.value = false
  }
}

function onUnlock() {
  if (isUnlocking.value || !showUnlockUi.value) return

  errorMessage.value = ''
  if (!isOnline.value) {
    errorMessage.value = 'Ø¨Ø±Ø§ÛŒ Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ø¨Ø±Ù†Ø§Ù…Ù‡ Ø¨Ù‡ Ø§ÛŒÙ†ØªØ±Ù†Øª Ù†ÛŒØ§Ø² Ø¯Ø§Ø±ÛŒØ¯.'
    return
  }

  const unlockPromise = unlockWithBiometric()
  isUnlocking.value = true
  unlockStatus.value = 'Ø§Ù†Ú¯Ø´Øª Ø®ÙˆØ¯ Ø±Ø§ Ø±ÙˆÛŒ Ø­Ø³Ú¯Ø± Ù‚Ø±Ø§Ø± Ø¯Ù‡ÛŒØ¯...'

  unlockPromise
    .then(async () => {
      // Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª ÙÙ‚Ø· Ù‚ÙÙ„ Ø§Ø³ØªØ› Ù„Ø§Ú¯ÛŒÙ† Ø¨ÙˆØ¯Ù† Ø¨Ø§ ØªÙˆÚ©Ù† Ú†Ú© Ù…ÛŒâ€ŒØ´ÙˆØ¯
      unlockStatus.value = 'Ø¯Ø± Ø­Ø§Ù„ Ø¨Ø±Ø±Ø³ÛŒ Ù†Ø´Ø³Øª...'
      const login = await checkLoginByToken()
      if (!login.ok) {
        showUnlockUi.value = false
        forcePasswordForm.value = true
        errorMessage.value =
          login.reason === 'expired'
            ? 'Ù†Ø´Ø³Øª Ù…Ù†Ù‚Ø¶ÛŒ Ø´Ø¯Ù‡ Ø§Ø³Øª. Ø¯ÙˆØ¨Ø§Ø±Ù‡ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯.'
            : 'Ù†Ø´Ø³Øª Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª. Ø¯ÙˆØ¨Ø§Ø±Ù‡ ÙˆØ§Ø±Ø¯ Ø´ÙˆÛŒØ¯.'
        return
      }
      await goSettingsAuthenticated()
    })
    .catch((error) => {
      if (error?.name === 'NotAllowedError') {
        errorMessage.value = 'ØªØ£ÛŒÛŒØ¯ Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª Ø§Ù†Ø¬Ø§Ù… Ù†Ø´Ø¯. Ø¯ÙˆØ¨Ø§Ø±Ù‡ Ø±ÙˆÛŒ Ø¢ÛŒÚ©ÙˆÙ† Ø¨Ø²Ù†ÛŒØ¯.'
      } else {
        errorMessage.value = error?.message || 'Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Ø¨Ø±Ù†Ø§Ù…Ù‡ Ù…Ù…Ú©Ù† Ù†Ø´Ø¯.'
      }
    })
    .finally(() => {
      isUnlocking.value = false
    })
}

function usePasswordInstead() {
  // Ù…Ø¹Ø§Ø¯Ù„ Ø®Ø±ÙˆØ¬ Ø§Ø² Ù‚ÙÙ„ Ùˆ ÙˆØ±ÙˆØ¯ Ù…Ø¬Ø¯Ø¯ Ø¨Ø§ ÙØ±Ù…
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
 * ØªÙˆÚ©Ù† = Ù„Ø§Ú¯ÛŒÙ† Ù¾Ø§ÛŒØ¯Ø§Ø±
 * Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª = ÙÙ‚Ø· Ù‚ÙÙ„ (Ø§Ú¯Ø± Ø®Ø±ÙˆØ¬ Ù†Ø²Ø¯Ù‡ Ø¨Ø§Ø´Ø¯ Ùˆ Ø´Ø±Ø§ÛŒØ· Ø¨Ø±Ù‚Ø±Ø§Ø± Ø¨Ø§Ø´Ø¯)
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
      await router.replace({ name: 'settings' })
      return
    }

    // Ù‡Ø± Ø¨Ø§Ø± ÙˆØ¶Ø¹ÛŒØª Ù„Ø§Ú¯ÛŒÙ† Ø¨Ø§ ØªÙˆÚ©Ù† Ú†Ú© Ù…ÛŒâ€ŒØ´ÙˆØ¯
    const login = await checkLoginByToken()
    if (!login.ok) {
      // Ø¨Ø¯ÙˆÙ† ØªÙˆÚ©Ù† ÛŒØ§ Ù…Ù†Ù‚Ø¶ÛŒ â†’ ÙØ±Ù… Ù„Ø§Ú¯ÛŒÙ†
      forcePasswordForm.value = true
      return
    }

    // ØªÙˆÚ©Ù† Ù…Ø¹ØªØ¨Ø±Ø› Ø§Ú¯Ø± Ù‚Ø¨Ù„Ø§Ù‹ Ø¯Ø± Ø§ÛŒÙ† Ù†Ø´Ø³Øª Ø¢Ù†Ù„Ø§Ú© Ø´Ø¯Ù‡ â†’ Ø®Ø§Ù†Ù‡
    if (isSessionUnlocked()) {
      await goSettingsAuthenticated()
      return
    }

    // Ù‚ÙÙ„ Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª ÙÙ‚Ø· ÙˆÙ‚ØªÛŒ Ø´Ø±Ø§ÛŒØ· Ø¨Ø§Ø´Ø¯ (Ø®Ø±ÙˆØ¬ Ù†Ø²Ø¯Ù‡ = ØªÙˆÚ©Ù† Ù‡Ø³Øª)
    if (!shouldShowAppLockGate(login.username)) {
      await goSettingsAuthenticated()
      return
    }

    // Ù…Ø±Ø­Ù„Ù‡ Û³ Ø§Ø®ØªØµØ§ØµÛŒ: Ø§Ø«Ø±Ø§Ù†Ú¯Ø´Øª Ø±ÙˆÛŒ Ø¯Ø³ØªÚ¯Ø§Ù‡ Ø«Ø¨Øª Ø´Ø¯Ù‡ØŸ
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
