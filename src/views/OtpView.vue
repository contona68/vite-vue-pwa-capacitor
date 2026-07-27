<template>
  <main class="page login-page">
    <section class="login-card" aria-labelledby="otp-title">
      <div class="brand">
        <img :src="appIcon" alt="لوگوی اپ" width="56" height="56" />
        <h1 id="otp-title">تأیید پیامکی</h1>
        <p class="subtitle">
          کد ارسال‌شده برای
          <strong>{{ username || 'کاربر' }}</strong>
          را وارد کنید.
        </p>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <div class="otp-boxes" role="group" aria-label="کد تأیید ۶ رقمی">
          <input
            v-for="(digit, index) in otpDigits"
            :key="index"
            :ref="(el) => setOtpRef(el, index)"
            class="otp-box"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="1"
            :name="index === 0 ? 'one-time-code' : undefined"
            :autocomplete="index === 0 ? 'one-time-code' : 'off'"
            :value="digit"
            :aria-label="`رقم ${index + 1}`"
            @input="onDigitInput(index, $event)"
            @keydown="onDigitKeydown(index, $event)"
            @paste="onOtpPaste"
          />
        </div>

        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

        <button
          class="btn primary"
          type="submit"
          :disabled="isSubmitting || !isOnline || otpCode.length < 6"
        >
          {{ isSubmitting ? 'در حال بررسی...' : 'تأیید کد' }}
        </button>

        <button class="btn ghost" type="button" @click="goBackToLogin">
          بازگشت به ورود
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  DEMO_OTP_CODE,
  getPendingUser,
  hasPendingLogin,
  isLoggedIn,
  logout,
} from '@/utils/auth'
import { appConfig, isFeatureEnabled } from '@/services/appConfig.service'
import { useConnectivity } from '@/services/connectivity.service'
import { completeTokenLogin } from '@/services/login.service'
import { APP_ICON_192 } from '@/utils/publicUrl'
import { isSmsAutoFillAvailable, listenForSmsOtp, normalizeOtpCode } from '@/adapters/sms'

const appIcon = APP_ICON_192
const router = useRouter()
const { isOnline } = useConnectivity()

const otpDigits = ref(['', '', '', '', '', ''])
const otpInputRefs = ref([])
const errorMessage = ref('')
const isSubmitting = ref(false)

const username = computed(() => getPendingUser())
const otpCode = computed(() => otpDigits.value.join(''))

let otpAbortController = null

function setOtpRef(el, index) {
  if (el) otpInputRefs.value[index] = el
}

function focusBox(index) {
  const el = otpInputRefs.value[index]
  if (el) {
    el.focus()
    el.select?.()
  }
}

function applyOtpToBoxes(rawCode) {
  const digits = normalizeOtpCode(rawCode, 6).split('')
  const next = ['', '', '', '', '', '']
  for (let i = 0; i < 6; i += 1) next[i] = digits[i] || ''
  otpDigits.value = next
  errorMessage.value = ''
  return next.join('')
}

function onDigitInput(index, event) {
  const raw = event.target.value || ''
  const normalized = normalizeOtpCode(raw, 6)

  if (normalized.length > 1) {
    applyOtpToBoxes(normalized)
    if (normalized.length >= 6) onSubmit()
    else focusBox(Math.min(normalized.length, 5))
    return
  }

  const digit = normalized.slice(-1)
  const next = [...otpDigits.value]
  next[index] = digit
  otpDigits.value = next
  errorMessage.value = ''
  event.target.value = digit

  if (digit && index < 5) focusBox(index + 1)
  if (next.join('').length === 6) onSubmit()
}

function onDigitKeydown(index, event) {
  if (event.key === 'Backspace') {
    if (otpDigits.value[index]) {
      const next = [...otpDigits.value]
      next[index] = ''
      otpDigits.value = next
      return
    }
    if (index > 0) {
      event.preventDefault()
      const next = [...otpDigits.value]
      next[index - 1] = ''
      otpDigits.value = next
      focusBox(index - 1)
    }
  }
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusBox(index - 1)
  }
  if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault()
    focusBox(index + 1)
  }
}

function onOtpPaste(event) {
  event.preventDefault()
  const code = applyOtpToBoxes(event.clipboardData?.getData('text') || '')
  if (code.length === 6) onSubmit()
  else if (code.length > 0) focusBox(Math.min(code.length, 5))
}

async function onSubmit() {
  errorMessage.value = ''
  const code = normalizeOtpCode(otpCode.value, 6)
  applyOtpToBoxes(code)

  if (code.length !== 6) {
    errorMessage.value = 'کد باید ۶ رقم باشد.'
    return
  }

  isSubmitting.value = true

  try {
    if (!isOnline.value) {
      errorMessage.value = 'برای ورود به اینترنت نیاز دارید.'
      return
    }

    if (code !== DEMO_OTP_CODE) {
      errorMessage.value = 'کد واردشده نادرست است.'
      return
    }

    const pendingUser = getPendingUser()
    if (!pendingUser) {
      errorMessage.value = 'نشست ورود منقضی شده است.'
      await router.replace({ name: 'login' })
      return
    }

    stopSmsOtpListener()
    await completeTokenLogin(pendingUser, code)
    await router.replace({ name: 'home' })
  } catch (error) {
    errorMessage.value = error?.message || 'صدور توکن ناموفق بود.'
  } finally {
    isSubmitting.value = false
  }
}

async function goBackToLogin() {
  stopSmsOtpListener()
  logout()
  await router.push({ name: 'login' })
}

function stopSmsOtpListener() {
  if (otpAbortController) {
    otpAbortController.abort()
    otpAbortController = null
  }
}

async function startSmsOtpListener() {
  if (!isSmsAutoFillAvailable()) return
  stopSmsOtpListener()
  otpAbortController = new AbortController()

  try {
    const rawCode = await listenForSmsOtp(otpAbortController.signal)
    if (rawCode == null) return
    const digits = applyOtpToBoxes(rawCode)
    await nextTick()
    if (digits.length === 6) await onSubmit()
  } catch (error) {
    if (error?.name !== 'AbortError') console.warn('[SMS OTP] failed:', error)
  }
}

async function finishWithoutOtpIfDisabled() {
  if (isFeatureEnabled('otp')) return false
  if (!isOnline.value) {
    await router.replace({ name: 'login' })
    return true
  }
  const pendingUser = getPendingUser()
  if (!pendingUser) {
    await router.replace({ name: 'login' })
    return true
  }
  stopSmsOtpListener()
  await completeTokenLogin(pendingUser, '')
  await router.replace({ name: 'home' })
  return true
}

onMounted(async () => {
  if (!isOnline.value) {
    await router.replace({ name: 'login' })
    return
  }
  if (isLoggedIn()) {
    await router.replace({ name: 'home' })
    return
  }
  if (!hasPendingLogin()) {
    await router.replace({ name: 'login' })
    return
  }
  if (await finishWithoutOtpIfDisabled()) return

  document.documentElement.classList.add('login-no-scroll')
  await nextTick()
  focusBox(0)
  startSmsOtpListener()
})

watch(isOnline, async (online) => {
  if (!online) {
    stopSmsOtpListener()
    await router.replace({ name: 'login' })
  }
})

watch(
  () => appConfig.value?.features?.otp,
  async (enabled) => {
    if (enabled === false && hasPendingLogin()) {
      await finishWithoutOtpIfDisabled()
    }
  },
)

onUnmounted(() => {
  document.documentElement.classList.remove('login-no-scroll')
  stopSmsOtpListener()
})
</script>

<style scoped>
.login-page {
  height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1rem;
  background:
    radial-gradient(ellipse at 20% 10%, rgba(56, 189, 248, 0.18), transparent 50%),
    radial-gradient(ellipse at 80% 90%, rgba(99, 102, 241, 0.16), transparent 45%),
    #0f172a;
}

.login-card {
  width: min(100%, 420px);
  padding: 1.5rem 1.25rem;
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.brand {
  text-align: center;
  margin-bottom: 1.25rem;
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
  margin: 0.4rem 0 0;
  color: #94a3b8;
  font-size: 0.88rem;
}

.subtitle strong {
  color: #e2e8f0;
}

.login-form {
  display: grid;
  gap: 0.85rem;
}

.otp-boxes {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem;
  direction: ltr;
}

.otp-box {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.55);
  color: #f8fafc;
  border-radius: 0.7rem;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  outline: none;
}

.otp-box:focus {
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

.btn.ghost {
  background: transparent;
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error {
  margin: 0;
  color: #fda4af;
  font-size: 0.88rem;
}
</style>
