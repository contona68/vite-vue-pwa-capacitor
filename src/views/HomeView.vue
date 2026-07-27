<template>
  <main class="page">
    <AppNav />
    <section class="content">
      <h1>خانه</h1>
      <p>
        خوش آمدید
        <strong>{{ username || 'کاربر' }}</strong>.
      </p>
      <p class="muted">
        این صفحه بعد از ورود نمایش داده می‌شود. صفحه لاگین برای باز شدن آفلاین اپ از پیش کش شده است.
      </p>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import AppNav from '@/components/AppNav.vue'
import { getCurrentUser } from '@/utils/auth'

const username = computed(() => getCurrentUser())
</script>

<style scoped>
.page {
  min-height: 100dvh;
  background: #f1f5f9;
}

.content {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.25rem;
}

h1 {
  margin: 0 0 0.75rem;
  color: #0f172a;
}

p {
  color: #334155;
  line-height: 1.7;
}

.muted {
  color: #64748b;
}
</style>
