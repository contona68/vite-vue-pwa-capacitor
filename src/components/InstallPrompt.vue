<template>
  <Teleport to="body">
    <Transition name="banner">
      <aside
        v-if="visible"
        class="install-banner"
        :class="{ 'is-steps': stepsVisible, 'is-ios': surface === 'ios' && stepsVisible }"
        role="dialog"
        aria-labelledby="install-title"
      >
        <img class="app-icon" :src="appIcon" alt="" width="48" height="48" />

        <div class="text">
          <strong id="install-title">{{ pwaUi.installTitle }}</strong>
          <p>{{ pwaUi.installBody }}</p>

          <template v-if="stepsVisible">
            <p v-if="surface === 'ios' && !onIosSafari" class="steps-intro">{{ pwaUi.iosNeedsSafari }}</p>
            <p v-else class="steps-intro">{{ pwaUi.installStepsIntro }}</p>

            <ol v-if="surface === 'ios'" class="guide-steps" aria-label="مراحل نصب">
              <li>
                <span class="step-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path
                      d="M12 4v10M8.5 7.5 12 4l3.5 3.5"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M6 13v5.2A1.8 1.8 0 0 0 7.8 20h8.4a1.8 1.8 0 0 0 1.8-1.8V13"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <span>دکمه <b>Share</b> پایین Safari را بزنید</span>
              </li>
              <li>
                <span class="step-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <rect
                      x="5"
                      y="5"
                      width="14"
                      height="14"
                      rx="2.5"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <path
                      d="M12 9v6M9 12h6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <span>
                  گزینه <b>Add to Home Screen</b>
                  <span class="fa-hint">(افزودن به صفحه اصلی)</span>
                  را انتخاب کنید
                </span>
              </li>
            </ol>

            <ol v-else class="guide-steps" aria-label="مراحل نصب">
              <li>
                <span class="step-badge" aria-hidden="true">1</span>
                <span>از منوی مرورگر گزینه <b>Install app</b> یا <b>نصب برنامه</b> را پیدا کنید</span>
              </li>
              <li>
                <span class="step-badge" aria-hidden="true">2</span>
                <span>نصب را تأیید کنید تا میانبر روی دستگاه ساخته شود</span>
              </li>
            </ol>
          </template>
        </div>

        <div class="actions">
          <button type="button" class="btn ghost" @click="dismiss">{{ pwaUi.installDismiss }}</button>
          <button type="button" class="btn primary" @click="onPrimary">
            {{ primaryLabel }}
          </button>
        </div>

        <div v-if="surface === 'ios' && stepsVisible" class="ios-pointer" aria-hidden="true" />
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * قوانین سخت:
 * 1) اگر اپ نصب است → هیچ بنر نصبی نه
 * 2) اگر بنر آپدیت فعال است (needRefresh) → بنر نصب نه؛ بعد از اتمام آپدیت، فقط اگر نصب نیست
 * 3) کروم/اج/اندروید → فقط بنر فشرده وقتی beforeinstallprompt آمده
 * 4) فایرفاکس/سافاری/iOS → فقط راهنمای دستی (هرگز بنر BIP کروم را شبیه‌سازی نکن)
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  browserUsesManualInstallGuide,
  consumeEarlyDeferredPrompt,
  getInstallSurface,
  incrementDismissLoadCount,
  isIosSafari,
  isPwaAlreadyInstalled,
  isStandaloneMode,
  markPwaInstalled,
  setLoadsSinceDismiss,
  shouldHideByDismissPolicy,
} from '@/utils/pwaInstall'
import { APP_ICON_192 } from '@/utils/publicUrl'
import { appConfig } from '@/services/appConfig.service'
import { needRefresh } from '@/pwa/updateState'
import { pwaInstallPolicy } from '@settings/pwa/install.policy.js'

const SHOW_DELAY_MS = pwaInstallPolicy.manualGuideDelayMs

const appIcon = APP_ICON_192
const visible = ref(false)
const stepsVisible = ref(false)

const surface = getInstallSurface()
const onIosSafari = isIosSafari()
const usesManualGuide = browserUsesManualInstallGuide()

const pwaUi = computed(() => appConfig.value.pwaUi)
const primaryLabel = computed(() =>
  stepsVisible.value ? pwaUi.value.guideConfirm : pwaUi.value.installAccept,
)

let deferredPrompt = null
let alreadyInstalled = false
let showTimer = null
let listenersBound = false

const standaloneMedia = window.matchMedia('(display-mode: standalone)')
const fullscreenMedia = window.matchMedia('(display-mode: fullscreen)')

function canShowBanner() {
  return !alreadyInstalled && !shouldHideByDismissPolicy() && !needRefresh.value
}

function hideBanner() {
  visible.value = false
  stepsVisible.value = false
}

async function refreshInstalledState() {
  alreadyInstalled = await isPwaAlreadyInstalled()
  if (alreadyInstalled) {
    deferredPrompt = null
    clearShowTimer()
    hideBanner()
  }
  return alreadyInstalled
}

/**
 * تصمیم نمایش:
 * - نصب‌شده / آپدیت باز / dismiss → هیچ
 * - BIP → بنر نصب کروم (فشرده)
 * - مرورگر دستی → راهنمای نصب
 * - کروم بدون BIP → هیچ (معمولاً یعنی نصب است یا هنوز آماده نیست)
 */
async function tryShowInstallBanner() {
  if (await refreshInstalledState()) return
  if (!canShowBanner()) {
    hideBanner()
    return
  }

  if (deferredPrompt) {
    stepsVisible.value = false
    visible.value = true
    return
  }

  if (usesManualGuide) {
    stepsVisible.value = true
    visible.value = true
    return
  }

  // Chromium بدون BIP: بنر نصب نشان نده (و راهنمای فایرفاکس هم هرگز)
  hideBanner()
}

function clearShowTimer() {
  if (showTimer == null) return
  window.clearTimeout(showTimer)
  showTimer = null
}

function scheduleManualGuideIfNeeded() {
  if (!usesManualGuide) return
  clearShowTimer()
  showTimer = window.setTimeout(() => {
    showTimer = null
    tryShowInstallBanner()
  }, SHOW_DELAY_MS)
}

async function applyDeferredPromptAsync(event) {
  if (!event) return false

  if (await isPwaAlreadyInstalled()) {
    alreadyInstalled = true
    deferredPrompt = null
    hideBanner()
    return false
  }

  deferredPrompt = event
  clearShowTimer()

  if (!canShowBanner()) {
    hideBanner()
    return true
  }

  stepsVisible.value = false
  visible.value = true
  return true
}

function onBeforeInstallPrompt(event) {
  event.preventDefault()
  applyDeferredPromptAsync(event)
}

function onAppInstalled() {
  alreadyInstalled = true
  markPwaInstalled()
  deferredPrompt = null
  clearShowTimer()
  hideBanner()
}

function onDisplayModeChange() {
  if (isStandaloneMode()) {
    alreadyInstalled = true
    markPwaInstalled()
    clearShowTimer()
    hideBanner()
  }
}

async function onVisibilityOrPageshow() {
  if (document.visibilityState && document.visibilityState !== 'visible') return
  if (await refreshInstalledState()) return
  // فقط اگر بنر باید دیده شود و هنوز چیزی نشان نداده‌ایم / کروم BIP دیر آمده
  if (!visible.value && canShowBanner()) {
    await tryShowInstallBanner()
  }
}

function dismiss() {
  hideBanner()
  setLoadsSinceDismiss(0)
  clearShowTimer()
}

async function onPrimary() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    deferredPrompt = null
    hideBanner()
    if (choice?.outcome === 'accepted') {
      alreadyInstalled = true
      markPwaInstalled()
    } else {
      setLoadsSinceDismiss(0)
    }
    return
  }

  // راهنمای دستی: تأیید = دیگر بنر نصب این مرورگر نشان داده نشود
  // (dismiss جداست و فقط تا N لود بعدی مخفی می‌کند)
  alreadyInstalled = true
  markPwaInstalled()
  clearShowTimer()
  hideBanner()
}

function bindInstallListeners() {
  if (listenersBound) return
  listenersBound = true
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
  window.addEventListener('pageshow', onVisibilityOrPageshow)
  document.addEventListener('visibilitychange', onVisibilityOrPageshow)
  standaloneMedia.addEventListener('change', onDisplayModeChange)
  fullscreenMedia.addEventListener('change', onDisplayModeChange)
}

function unbindInstallListeners() {
  if (!listenersBound) return
  listenersBound = false
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.removeEventListener('appinstalled', onAppInstalled)
  window.removeEventListener('pageshow', onVisibilityOrPageshow)
  document.removeEventListener('visibilitychange', onVisibilityOrPageshow)
  standaloneMedia.removeEventListener('change', onDisplayModeChange)
  fullscreenMedia.removeEventListener('change', onDisplayModeChange)
}

watch(needRefresh, async (updating) => {
  if (updating) {
    hideBanner()
    return
  }
  // آپدیت تمام/رد شد → فقط اگر هنوز نصب نیست بنر نصب
  await tryShowInstallBanner()
})

onMounted(async () => {
  bindInstallListeners()

  // ۱) نصب از قبل؟
  if (await refreshInstalledState()) return

  // ۲) BIP زودهنگام — فقط اگر واقعاً نصب نیست
  await applyDeferredPromptAsync(consumeEarlyDeferredPrompt())
  incrementDismissLoadCount()

  // ۳) آپدیت باز؟ نصب را نشان نده
  if (needRefresh.value) {
    hideBanner()
    return
  }

  if (!canShowBanner()) return

  // ۴) کروم با BIP → بنر نصب؛ فایرفاکس → راهنما؛ کروم بدون BIP → هیچ
  if (deferredPrompt) {
    stepsVisible.value = false
    visible.value = true
    return
  }

  if (usesManualGuide) {
    scheduleManualGuideIfNeeded()
  }
})

onUnmounted(() => {
  clearShowTimer()
  unbindInstallListeners()
})
</script>

<style scoped>
.install-banner {
  position: fixed;
  z-index: 10040;
  inset-inline: 24px;
  bottom: max(24px, env(safe-area-inset-bottom, 0px));
  left: 24px;
  right: 24px;
  width: auto;
  max-width: none;
  margin-inline: 0;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: center;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  pointer-events: auto;
}

.install-banner.is-steps {
  align-items: flex-start;
  padding-bottom: 1.45rem;
  background: linear-gradient(165deg, #f0f9ff 0%, #ffffff 42%, #f8fafc 100%);
  border-color: #bae6fd;
  box-shadow:
    0 16px 40px rgba(14, 165, 233, 0.14),
    0 4px 12px rgba(15, 23, 42, 0.06);
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
  margin-bottom: 0.25rem;
  color: #0f172a;
  font-size: 1.02rem;
}

.text p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.55;
}

.steps-intro {
  margin-top: 0.65rem !important;
  color: #0369a1 !important;
  font-weight: 600;
}

.text p b,
.guide-steps b {
  color: #0c4a6e;
  font-weight: 700;
}

.guide-steps {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

.guide-steps li {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.5;
}

.fa-hint {
  color: #64748b;
  font-weight: 500;
}

.step-badge {
  flex-shrink: 0;
  min-width: 1.85rem;
  height: 1.85rem;
  padding-inline: 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.55rem;
  background: #ffedd5;
  color: #c2410c;
  border: 1px solid #bae6fd;
  font-size: 0.78rem;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-inline-start: auto;
  width: 100%;
  justify-content: flex-end;
}

.install-banner:not(.is-steps) .actions {
  width: auto;
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

.ios-pointer {
  position: absolute;
  left: 50%;
  bottom: -0.35rem;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  background: #ffffff;
  border-right: 1px solid #bae6fd;
  border-bottom: 1px solid #bae6fd;
  transform: rotate(45deg);
  box-shadow: 2px 2px 4px rgba(14, 165, 233, 0.08);
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

@media (min-width: 520px) {
  .install-banner.is-steps .actions {
    width: auto;
    margin-top: 0.15rem;
  }
}
</style>
