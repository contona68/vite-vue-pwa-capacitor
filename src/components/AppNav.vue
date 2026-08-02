<template>
  <nav class="nav" aria-label="منوی اصلی">
    <div class="nav-start">
      <button
        v-if="showBack"
        type="button"
        class="back-btn"
        aria-label="بازگشت"
        @click="onBack"
      >
        <span aria-hidden="true">→</span>
        بازگشت
      </button>
      <RouterLink class="brand" :to="brandTarget">{{ brandName }}</RouterLink>
    </div>
    <div class="links">
      <RouterLink v-if="loggedIn" :to="{ name: 'settings' }">تنظیمات</RouterLink>
      <!-- TEMP: فقط برای تست انقضای توکن — بعداً حذف شود -->
      <button
        v-if="loggedIn"
        type="button"
        class="test-expire-btn"
        title="تست: منقضی کردن توکن"
        @click="expireTokenForTest"
      >
        انقضای توکن
      </button>
      <button v-if="loggedIn" type="button" class="logout-btn" @click="onLogout">
        خروج
      </button>
      <RouterLink v-else :to="{ name: 'login' }">ورود</RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isLoggedIn } from '@/utils/auth'
import { appConfig } from '@/services/appConfig.service'
import { performLogout } from '@/services/session.service'
import { goBack, shouldShowWebBackButton } from '@/services/navigation.service'
import { isBackableRoute } from '@/adapters/navigation'

const router = useRouter()
const route = useRoute()
const loggedIn = computed(() => {
  void route.fullPath
  return isLoggedIn()
})
const brandName = computed(() => appConfig.value.branding.appName)
const brandTarget = computed(() =>
  loggedIn.value ? { name: 'settings' } : { name: 'login' },
)
const showBack = computed(
  () => shouldShowWebBackButton() && isBackableRoute(route.name),
)

async function onBack() {
  await goBack()
}

async function onLogout() {
  performLogout()
  await router.push({ name: 'login' })
}

/** TEMP — فقط UI تست؛ منطق اصلی auth را تغییر نمی‌دهد */
async function expireTokenForTest() {
  const metaKey = 'auth_token_meta'
  const unlockKey = 'auth_session_unlocked'
  try {
    const raw = localStorage.getItem(metaKey)
    const meta = raw ? JSON.parse(raw) : {}
    localStorage.setItem(
      metaKey,
      JSON.stringify({
        ...meta,
        expiresAt: Date.now() - 1000,
      }),
    )
  } catch (_) {
    // ignore
  }
  sessionStorage.removeItem(unlockKey)
  await router.push({ name: 'boot' })
}
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  padding-top: calc(0.9rem + env(safe-area-inset-top, 0px));
  background: #c2410c;
  color: #fff7ed;
}

.nav-start {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.brand {
  font-weight: 700;
  color: #ffedd5;
  text-decoration: none;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #ffedd5;
  background: none;
  border: 1px solid rgba(255, 237, 213, 0.45);
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.back-btn:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.7);
}

.links {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.links a,
.logout-btn,
.test-expire-btn {
  color: #ffedd5;
  text-decoration: none;
  font-size: 0.95rem;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.links a.router-link-active {
  color: #fff;
  font-weight: 600;
}

.logout-btn:hover {
  color: #fff;
}

.test-expire-btn {
  color: #fde68a;
  font-size: 0.82rem;
}

.test-expire-btn:hover {
  color: #fef3c7;
}
</style>
