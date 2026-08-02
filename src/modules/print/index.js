/**
 * سرویس سطح‌بالای پرینت — فقط از ماژول print و adapter استفاده می‌کند.
 */

import { printSettings } from '@settings/print'
import { getPrintProviderLabel, isPrintSupported, printCurrentDocument } from '@/adapters/print'

/**
 * رفتن به صفحهٔ پیش‌فرض پرینت (مد پرینت)
 * @param {import('vue-router').Router} router
 */
export async function openDefaultPrintPage(router) {
  if (!router || typeof router.push !== 'function') {
    throw new Error('Router is required for print preview')
  }

  await router.push({ name: printSettings.routeName })
}

/**
 * اجرای پرینت سند فعلی (بعد از نمایش صفحهٔ پیش‌فرض)
 * @param {{ jobName?: string }} [options]
 */
export async function runPrint(options = {}) {
  if (!(await isPrintSupported())) {
    throw new Error('چاپ در این محیط پشتیبانی نمی‌شود')
  }

  return printCurrentDocument({
    jobName: options.jobName || printSettings.defaultJobName,
  })
}

export { getPrintProviderLabel, isPrintSupported, printSettings }
