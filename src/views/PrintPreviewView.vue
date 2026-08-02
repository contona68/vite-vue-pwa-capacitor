<template>
  <main class="print-page">
    <AppNav class="no-print" />

    <section class="toolbar no-print">
      <p class="hint">
        صفحهٔ پیش‌فرض چاپ — منبع:
        <strong>{{ providerLabel }}</strong>
      </p>
      <div class="actions">
        <button type="button" class="btn ghost" :disabled="printing" @click="goBackToSettings">
          بازگشت به تنظیمات
        </button>
        <button type="button" class="btn primary" :disabled="printing" @click="onPrint">
          {{ printing ? 'در حال باز شدن...' : 'چاپ' }}
        </button>
      </div>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>

    <article class="sheet" aria-label="سند چاپ">
      <header class="sheet-head">
        <img class="logo" :src="logoSrc" alt="" width="64" height="64" />
        <div>
          <h1>{{ document.brand }}</h1>
          <p class="sheet-title">{{ document.title }}</p>
        </div>
      </header>

      <p class="meta">تاریخ تولید: {{ document.generatedAt }}</p>

      <ul class="lines">
        <li v-for="(line, index) in document.lines" :key="index">{{ line }}</li>
      </ul>

      <footer class="sheet-foot">
        برگه آزمایشی چاپ — {{ document.brand }}
      </footer>
    </article>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { buildDefaultPrintDocument } from '@/modules/print/document.js'
import {
  getPrintProviderLabel,
  printSettings,
  runPrint,
} from '@/modules/print'
import { APP_ICON_192 } from '@/utils/publicUrl'

const router = useRouter()
const document = ref(buildDefaultPrintDocument())
const providerLabel = getPrintProviderLabel()
const printing = ref(false)
const errorMessage = ref('')
const logoSrc = APP_ICON_192

async function onPrint() {
  errorMessage.value = ''
  printing.value = true
  try {
    await runPrint({ jobName: printSettings.defaultJobName })
  } catch (error) {
    errorMessage.value = error?.message || 'باز کردن حالت چاپ ناموفق بود.'
  } finally {
    printing.value = false
  }
}

function goBackToSettings() {
  router.push({ name: 'settings' })
}

onMounted(() => {
  window.setTimeout(() => {
    onPrint()
  }, printSettings.autoPrintDelayMs)
})
</script>

<style scoped>
.print-page {
  min-height: 100dvh;
  background: #fff8f0;
  color: #7c2d12;
}

.toolbar {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem 1.25rem 0.5rem;
  display: grid;
  gap: 0.75rem;
}

.hint {
  margin: 0;
  font-size: 0.9rem;
  color: #b45309;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.7rem 1rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: linear-gradient(135deg, #fdba74, #f29220);
  color: #7c2d12;
}

.btn.ghost {
  background: #fff;
  color: #9a3412;
  border: 1px solid rgba(242, 146, 32, 0.28);
}

.btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error {
  margin: 0;
  color: #e11d48;
  font-size: 0.88rem;
}

.sheet {
  max-width: 720px;
  margin: 0.75rem auto 2rem;
  padding: 1.5rem 1.35rem;
  background: #fff;
  border: 1px solid rgba(242, 146, 32, 0.22);
  border-radius: 1rem;
  box-shadow: 0 12px 28px rgba(242, 146, 32, 0.1);
}

.sheet-head {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.logo {
  border-radius: 0.75rem;
}

.sheet h1 {
  margin: 0;
  font-size: 1.35rem;
}

.sheet-title {
  margin: 0.25rem 0 0;
  color: #b45309;
  font-weight: 600;
}

.meta {
  margin: 0 0 1rem;
  color: #9a3412;
  font-size: 0.92rem;
}

.lines {
  margin: 0;
  padding-inline-start: 1.2rem;
  display: grid;
  gap: 0.45rem;
  line-height: 1.7;
}

.sheet-foot {
  margin-top: 1.5rem;
  padding-top: 0.85rem;
  border-top: 1px dashed rgba(242, 146, 32, 0.35);
  font-size: 0.85rem;
  color: #b45309;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-page {
    background: #fff;
  }

  .sheet {
    margin: 0;
    max-width: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }
}
</style>
