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
                :disabled="saving || (item.key === 'location' && locationBusy) || (item.key === 'barcode' && barcodeBusy)"
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

        <section class="camera-panel" aria-labelledby="print-panel-title">
          <div class="camera-panel-head">
            <h2 id="print-panel-title">چاپ</h2>
            <span class="camera-provider">منبع: {{ printProviderLabel }}</span>
          </div>
          <p class="camera-hint">
            یک برگهٔ پیش‌فرض باز می‌شود و دیالوگ چاپ سیستم (وب یا PrintManager اندروید) نمایش داده می‌شود.
          </p>
          <div class="camera-actions">
            <button
              type="button"
              class="btn primary"
              :disabled="printBusy"
              @click="onOpenPrint"
            >
              {{ printBusy ? 'در حال باز شدن...' : 'چاپ صفحه پیش‌فرض' }}
            </button>
          </div>
          <p v-if="printError" class="error" role="alert">{{ printError }}</p>
        </section>

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
            <div v-if="locationInfo.placeName" class="location-row">
              <span>نام محل</span>
              <strong>{{ locationInfo.placeName }}</strong>
            </div>
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

        <section v-if="draftFeatures.barcode" class="camera-panel" aria-labelledby="barcode-panel-title">
          <div class="camera-panel-head">
            <h2 id="barcode-panel-title">بارکدخوان</h2>
            <span class="camera-provider">منبع: {{ barcodeProviderLabel }}</span>
          </div>
          <p class="camera-hint">
            با «شروع اسکن» اسکنر native اندروید باز می‌شود. اگر دستگاه پشتیبانی نکند، پیام مناسب نمایش داده می‌شود.
          </p>

          <div class="camera-media-row">
            <div class="camera-box">
              <span class="camera-box-label">اسکنر</span>
              <div class="camera-preview-wrap">
                <video
                  ref="barcodeVideoRef"
                  class="camera-preview"
                  autoplay
                  playsinline
                  muted
                  :class="{ 'is-active': barcodeReady }"
                />
                <p v-if="!barcodeReady" class="camera-placeholder">پیش‌نمایش بارکدخوان</p>
              </div>
            </div>

            <div class="camera-box">
              <span class="camera-box-label">بارکد خوانده‌شده</span>
              <div class="camera-preview-wrap captured-wrap barcode-result-wrap">
                <div v-if="scannedBarcode" class="barcode-result" role="status">
                  <strong>{{ scannedBarcode.rawValue }}</strong>
                  <span>{{ scannedBarcode.format }}</span>
                </div>
                <p v-else class="camera-placeholder">هنوز بارکدی خوانده نشده</p>
              </div>
            </div>
          </div>

          <div class="camera-actions">
            <button
              type="button"
              class="btn ghost"
              :disabled="barcodeBusy"
              @click="onOpenOrResetBarcode"
            >
              {{ barcodeReady ? 'ریست بارکدخوان' : 'شروع اسکن' }}
            </button>
            <button
              type="button"
              class="btn primary"
              :disabled="barcodeBusy || !barcodeReady"
              @click="shutdownBarcode"
            >
              توقف اسکن
            </button>
          </div>

          <p v-if="barcodeError" class="error" role="alert">{{ barcodeError }}</p>
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
import {
  getBarcodeProviderLabel,
  resetBarcodeScan,
  startBarcodeScan,
  stopBarcodeScan,
} from '@/services/barcode.service'
import { isNativePlatform } from '@/platform/env'
import { useRouter } from 'vue-router'
import {
  getPrintProviderLabel,
  openDefaultPrintPage,
} from '@/modules/print'

const router = useRouter()
const printBusy = ref(false)
const printError = ref('')
const printProviderLabel = getPrintProviderLabel()

async function onOpenPrint() {
  printError.value = ''
  printBusy.value = true
  try {
    await openDefaultPrintPage(router)
  } catch (error) {
    printError.value = error?.message || 'باز کردن صفحه چاپ ناموفق بود.'
  } finally {
    printBusy.value = false
  }
}

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
  {
    key: 'barcode',
    title: 'بارکدخوان',
    description: 'اسکن بارکد با اسکنر native اندروید (فعلاً فقط در اپ).',
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

const barcodeVideoRef = ref(null)
const barcodeReady = ref(false)
const barcodeBusy = ref(false)
const barcodeError = ref('')
/** @type {import('vue').Ref<{ rawValue: string, format: string } | null>} */
const scannedBarcode = ref(null)

const sourceFeatures = computed(() => appConfig.value.features)
const canShowAppLockToggle = computed(() => isFeatureEnabled('appLock'))
const cameraProviderLabel = computed(() =>
  getCameraProviderLabel() === 'native' ? 'دستگاه (native)' : 'وب (getUserMedia)',
)
const locationProviderLabel = computed(() =>
  getLocationProviderLabel() === 'native' ? 'دستگاه (native)' : 'وب (Geolocation)',
)
const barcodeProviderLabel = computed(() =>
  getBarcodeProviderLabel() === 'native' ? 'دستگاه (native)' : 'وب',
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
  if (key === 'barcode') {
    if (!checked) {
      shutdownBarcode()
      return
    }
    if (!isNativePlatform()) {
      window.alert('بارکدخوان فعلاً در نسخهٔ وب در دسترس نیست.')
      draftFeatures.barcode = false
      return
    }
    nextTick(() => onOpenOrResetBarcode())
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

async function shutdownBarcode() {
  try {
    await stopBarcodeScan({ videoElement: barcodeVideoRef.value || undefined })
  } catch (_) {
    // ignore
  }
  barcodeReady.value = false
  barcodeBusy.value = false
  barcodeError.value = ''
}

async function waitForBarcodeVideo(maxAttempts = 12) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await nextTick()
    if (barcodeVideoRef.value) return barcodeVideoRef.value
    await new Promise((resolve) => setTimeout(resolve, 40))
  }
  return null
}

async function onOpenOrResetBarcode() {
  if (!isNativePlatform()) {
    window.alert('بارکدخوان فعلاً در نسخهٔ وب در دسترس نیست.')
    draftFeatures.barcode = false
    return
  }

  barcodeError.value = ''
  barcodeBusy.value = true
  try {
    const videoElement = await waitForBarcodeVideo()
    const options = {
      videoElement: videoElement || undefined,
      onDetected: (result) => {
        if (!result?.rawValue) return
        scannedBarcode.value = {
          rawValue: result.rawValue,
          format: result.format || 'unknown',
        }
      },
    }

    const started = barcodeReady.value
      ? await resetBarcodeScan(options)
      : await startBarcodeScan(options)

    // اسکنر native یک‌باره است؛ پیش‌نمایش زنده لازم نیست.
    barcodeReady.value = started?.mode === 'stream'
  } catch (error) {
    barcodeReady.value = false
    barcodeError.value = error?.message || 'شروع بارکدخوان ناموفق بود.'
  } finally {
    barcodeBusy.value = false
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
    if (!draftFeatures.barcode) {
      await shutdownBarcode()
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
    await shutdownBarcode()
    scannedBarcode.value = null
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
  if (draftFeatures.barcode && !isNativePlatform()) {
    draftFeatures.barcode = false
  }
  if (draftFeatures.location) {
    refreshLocation()
  }
})

onBeforeUnmount(() => {
  shutdownCamera()
  clearLocation()
  shutdownBarcode()
})

watch(sourceFeatures, () => {
  if (!dirty.value) syncDraftFromConfig()
})
</script>

<style scoped>
.page {
  min-height: 100dvh;
  background: #fff4e8;
}

.content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0.85rem 0.85rem 1rem;
}

h1 {
  margin: 0 0 0.55rem;
  color: #7c2d12;
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
  border: 1px solid #fed7aa;
}

.feature-text {
  display: grid;
  gap: 0.05rem;
  min-width: 0;
}

.feature-text strong {
  color: #7c2d12;
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
  background: #f29220;
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
  color: #7c2d12;
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
  background: #44403c;
}

.camera-preview {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #44403c;
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
  background: #fff4e8;
}

.barcode-result-wrap {
  display: grid;
  place-items: center;
  padding: 0.5rem;
}

.barcode-result {
  display: grid;
  gap: 0.35rem;
  text-align: center;
  word-break: break-all;
}

.barcode-result strong {
  color: #7c2d12;
  font-size: 0.9rem;
  line-height: 1.35;
}

.barcode-result span {
  color: #64748b;
  font-size: 0.72rem;
  text-transform: uppercase;
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
  background: #fff8f0;
  border: 1px solid #fed7aa;
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
  color: #7c2d12;
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
  background: #f29220;
  color: #fff;
}

.btn.ghost {
  background: #fff;
  color: #9a3412;
  border: 1px solid #fdba74;
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
