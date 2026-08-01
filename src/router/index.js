import { createRouter, createWebHistory } from 'vue-router'
import { hasPendingLogin, hasStoredToken, isLoggedIn, isSessionUnlocked } from '@/utils/auth'
import { appConfig, isFeatureEnabled } from '@/services/appConfig.service'
import { isBrowserOnline } from '@/utils/network'
import { shouldShowAppLockGate } from '@/services/session.service'

const routes = [
  {
    path: '/',
    name: 'boot',
    component: () => import('@/views/BootView.vue'),
    meta: { title: 'بارگذاری', public: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'ورود', public: true },
  },
  {
    path: '/otp',
    name: 'otp',
    component: () => import('@/views/OtpView.vue'),
    meta: { title: 'تأیید پیامکی', public: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/FeatureSettingsView.vue'),
    meta: { title: 'تنظیمات', requiresAuth: true },
  },
  // مسیرهای قدیمی
  { path: '/home', redirect: { name: 'settings' } },
  { path: '/about', redirect: { name: 'settings' } },
  { path: '/settings/features', redirect: { name: 'settings' } },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.name === 'boot') return true

  // آفلاین: فقط صفحه ورود (حتی اگر نشست قبلی باز باشد)
  if (!isBrowserOnline()) {
    return to.name === 'login' ? true : { name: 'login' }
  }

  if (to.meta.requiresAuth && !isLoggedIn()) {
    if (hasPendingLogin() && isFeatureEnabled('otp')) return { name: 'otp' }
    if (hasStoredToken() && shouldShowAppLockGate() && !isSessionUnlocked()) {
      return { name: 'login' }
    }
    if (hasStoredToken() && !isSessionUnlocked()) {
      return { name: 'boot' }
    }
    return { name: 'login' }
  }

  if (to.name === 'otp') {
    if (!isFeatureEnabled('otp')) {
      return hasPendingLogin() || isLoggedIn() ? { name: 'boot' } : { name: 'login' }
    }
    if (!hasPendingLogin()) {
      return isLoggedIn() ? { name: 'settings' } : { name: 'login' }
    }
  }

  if (to.name === 'login' && isLoggedIn()) {
    return { name: 'settings' }
  }

  return true
})

router.afterEach((to) => {
  const brand = appConfig.value?.branding?.appName || 'هایپریک'
  const pageTitle = to.meta.title ? String(to.meta.title) : brand
  document.title = `${pageTitle} | ${brand}`
})

export default router
