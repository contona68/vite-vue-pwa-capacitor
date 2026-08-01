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
                :disabled="saving || (item.key === 'location' && locationBusy)"
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

        <!-- تست دوربین زیر دکمه‌های ذخیره -->
        <section v-if="draftFeatures.camera" class="camera-panel" aria-labelledby="camera-panel-title">
          <div class="camera-panel-head">
            <h2 id="camera-panel-title">تست دوربین</h2>
            <span class="camera-provider">منبع: {{ cameraProviderLabel }}</span>
          </div>
          <p class="camera-hint">
            «باز کردن / ریست» پیش‌نمایش زنده را شروع می‌کند؛ «عکس بگیر» همان فریم را ثبت می‌کند.
            اگر پیش‌نمایش ممکن نباشد، عکس با دوربین سیستم گرفته می‌شود.
          </p>

          <div class="camera-media-row">
            <div class="camera-box">
              <span class="camera-box-label">پیش‌نمایش</span>
              <div class="camera-preview-wrap">
                <video
                  ref="videoRef"
                  class="camera-preview"
                  autoplay
                  playsinline
                  muted
                  :class="{ 'is-active': cameraReady }"
                />
                <p v-if="!cameraReady" class="camera-placeholder">پیش‌نمایش</p>
                <p v-else-if="cameraMode === 'native-prompt'" class="camera-placeholder native-hint">
                  آمادهٔ native
                </p>
              </div>
            </div>

            <div class="camera-box">
              <span class="camera-box-label">عکس</span>
              <div class="camera-preview-wrap captured-wrap">
                <img
                  v-if="capturedPhoto"
                  :src="capturedPhoto"
                  alt="عکس گرفته‌شده از دوربین"
                  class="captured-photo"
                />
                <p v-else class="camera-placeholder">هنوز عکسی نیست</p>
              </div>
            </div>
          </div>

          <div class="camera-actions">
            <button
              type="button"
              class="btn ghost"
              :disabled="cameraBusy"
              @click="onOpenOrResetCamera"
            >
              {{ cameraReady ? 'ریست دوربین' : 'باز کردن دوربین' }}
            </button>
            <button
              type="button"
              class="btn primary"
              :disabled="cameraBusy || (!cameraReady && cameraMode !== 'native-prompt')"
              @click="onCapturePhoto"
            >
              عکس بگیر
            </button>
          </div>

          <p v-if="cameraError" class="error" role="alert">{{ cameraError }}</p>
        </section>

        <section v-if="draftFeatures.location" class="location-panel" aria-labelledby="location-panel-title">
          <div class="camera-panel-head">
            <h2 id="location-panel-title">موقعیت مکانی</h2>
            <span class="camera-provider">منبع: {{ locationProviderLabel }}</span>
          </div>
          <p class="camera-hint">
            با روشن کردن سوییچ، اجازه گرفته می‌شود و مختصات فعلی نشان داده می‌شود.
          </p>

          <div v-if="locationInfo" class="location-card" role="status">
            <div class="location-row">
              <span>عرض جغرافیایی</span>
              <strong>{{ formatCoordinate(locationInfo.latitude) }}</strong>
            </div>
            <div class="location-row">
              <span>طول جغرافیایی</span>
              <strong>{{ formatCoordinate(locationInfo.longitude) }}</strong>
            </div>
            <div class="location-row">
              <span>دقت</span>
              <strong>{{ formatAccuracy(locationInfo.accuracy) }}</strong>
            </div>
            <div v-if="locationInfo.altitude != null" class="location-row">
              <span>ارتفاع</span>
              <strong>{{ formatAccuracy(locationInfo.altitude) }}</strong>
            </div>
          </div>
          <p v-else-if="locationBusy" class="camera-hint">در حال دریافت موقعیت...</p>
          <p v-else class="camera-hint">هنوز موقعیتی دریافت نشده است.</p>

          <div class="camera-actions">
            <button
              type="button"
              class="btn ghost"
              :disabled="locationBusy"
              @click="refreshLocation"
            >
              {{ locationBusy ? 'در حال دریافت...' : 'بروزرسانی موقعیت' }}
            </button>
          </div>

          <p v-if="locationError" class="error" role="alert">{{ locationError }}</p>
        </section>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
import {
  capturePhoto,
  closeCamera,
  getCameraProviderLabel,
  openCamera,
  resetCamera,
} from '@/services/camera.service'
import {
  getCurrentPosition,
  getLocationProviderLabel,
  isLocationSupported,
} from '@/services/location.service'

const featureItems = [
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
  {
    key: 'camera',
    title: 'استفاده از دوربین',
    description: 'امکان باز کردن دوربین و گرفتن عکس در همین صفحه.',
  },
  {
    key: 'location',
    title: 'موقعیت مکانی',
    description: 'نمایش مختصات فعلی پس از دریافت اجازهٔ لوکیشن.',
  },
]

const draftFeatures = reactive({})
const draftAppLockEnabled = ref(false)
const dirty = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const videoRef = ref(null)
const cameraReady = ref(false)
const cameraBusy = ref(false)
const cameraError = ref('')
const capturedPhoto = ref('')
/** @type {import('vue').Ref<'stream' | 'native-prompt' | 'native-bridge' | ''>} */
const cameraMode = ref('')

const locationBusy = ref(false)
const locationError = ref('')
const locationInfo = ref(null)

const sourceFeatures = computed(() => appConfig.value.features)
const canShowAppLockToggle = computed(() => isFeatureEnabled('appLock'))
const cameraProviderLabel = computed(() =>
  getCameraProviderLabel() === 'native' ? 'دستگاه (native)' : 'وب (getUserMedia)',
)
const locationProviderLabel = computed(() =>
  getLocationProviderLabel() === 'native' ? 'دستگاه (native)' : 'وب (Geolocation)',
)

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
  if (key === 'camera' && !checked) {
    shutdownCamera()
  }
  if (key === 'location') {
    if (checked) {
      refreshLocation()
    } else {
      clearLocation()
    }
  }
}

function onAppLockToggle(checked) {
  draftAppLockEnabled.value = checked
  dirty.value = true
  successMessage.value = ''
}

async function shutdownCamera() {
  try {
    await closeCamera({ videoElement: videoRef.value || undefined })
  } catch (_) {
    // ignore
  }
  cameraReady.value = false
  cameraMode.value = ''
  cameraError.value = ''
  capturedPhoto.value = ''
}

async function onOpenOrResetCamera() {
  cameraError.value = ''
  cameraBusy.value = true
  try {
    await nextTick()
    const options = { videoElement: videoRef.value || undefined }
    const result = cameraReady.value
      ? await resetCamera(options)
      : await openCamera(options)

    cameraMode.value = result?.mode || ''
    cameraReady.value = true
    if (result?.mode === 'native-prompt') {
      cameraError.value = ''
      // بدون پیش‌نمایش استریم؛ عکس با دیالوگ native گرفته می‌شود
    }
  } catch (error) {
    cameraReady.value = false
    cameraMode.value = ''
    cameraError.value = error?.message || 'باز کردن دوربین ناموفق بود.'
  } finally {
    cameraBusy.value = false
  }
}

async function onCapturePhoto() {
  cameraError.value = ''
  cameraBusy.value = true
  try {
    const result = await capturePhoto({ videoElement: videoRef.value || undefined })
    capturedPhoto.value = result?.dataUrl || ''
    if (!capturedPhoto.value) {
      throw new Error('عکسی ثبت نشد.')
    }
  } catch (error) {
    cameraError.value = error?.message || 'گرفتن عکس ناموفق بود.'
  } finally {
    cameraBusy.value = false
  }
}

function clearLocation() {
  locationInfo.value = null
  locationError.value = ''
  locationBusy.value = false
}

function formatCoordinate(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(6)
}

function formatAccuracy(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Math.round(Number(value))} متر`
}

async function refreshLocation() {
  locationError.value = ''
  locationBusy.value = true
  try {
    if (!isLocationSupported()) {
      throw new Error('موقعیت مکانی در این محیط پشتیبانی نمی‌شود.')
    }
    locationInfo.value = await getCurrentPosition()
  } catch (error) {
    locationInfo.value = null
    locationError.value = error?.message || 'دریافت موقعیت مکانی ناموفق بود.'
  } finally {
    locationBusy.value = false
  }
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

    if (!draftFeatures.camera) {
      await shutdownCamera()
    }
    if (!draftFeatures.location) {
      clearLocation()
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
    await shutdownCamera()
    clearLocation()
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
  if (draftFeatures.location) {
    refreshLocation()
  }
})

onBeforeUnmount(() => {
  shutdownCamera()
  clearLocation()
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

.camera-panel {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border-radius: 0.7rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  margin-top: 0.35rem;
}

.camera-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.camera-panel-head h2 {
  margin: 0;
  font-size: 0.95rem;
  color: #0f172a;
}

.camera-provider {
  font-size: 0.72rem;
  color: #64748b;
}

.camera-hint {
  margin: 0;
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.4;
}

.camera-media-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.camera-box {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.camera-box-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
}

.camera-preview-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #0f172a;
}

.camera-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #0f172a;
  opacity: 0;
}

.camera-preview.is-active {
  opacity: 1;
}

.camera-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 0.35rem;
  color: #94a3b8;
  font-size: 0.72rem;
  text-align: center;
  pointer-events: none;
}

.camera-placeholder.native-hint {
  font-size: 0.68rem;
  line-height: 1.35;
}

.captured-wrap {
  background: #f1f5f9;
}

.captured-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.location-panel {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border-radius: 0.7rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  margin-top: 0.35rem;
}

.location-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.55rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.location-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.location-row span {
  color: #64748b;
}

.location-row strong {
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  direction: ltr;
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
