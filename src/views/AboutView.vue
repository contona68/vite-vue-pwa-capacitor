<template>
  <main class="page">
    <AppNav />
    <section class="content">
      <h1>درباره ما</h1>
      <p>
        این پروژه با <strong>Vite</strong>، <strong>Vue 3</strong> و <strong>vite-plugin-pwa</strong>
        راه‌اندازی شده و قابلیت نصب روی گوشی، اسپلش اولیه و کار آفلاین برای صفحه لاگین را دارد.
      </p>
      <ul>
        <li>Manifest و Service Worker</li>
        <li>کش ناوبری صفحه Login</li>
        <li>پیغام نصب سفارشی</li>
        <li>اسپلش هنگام راه‌اندازی اپ</li>
      </ul>
    </section>
  </main>
</template>

<script setup>
import AppNav from '@/components/AppNav.vue'
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

p,
li {
  color: #334155;
  line-height: 1.7;
}

ul {
  margin: 1rem 0 0;
  padding-inline-start: 1.2rem;
}
</style>
