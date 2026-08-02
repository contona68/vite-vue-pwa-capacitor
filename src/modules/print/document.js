/**
 * محتوای سند پیش‌فرض پرینت — بدون وابستگی به Vue
 */

import { brandingDefaults } from '@settings/branding/defaults.js'
import { printSettings } from '@settings/print/defaults.js'

/**
 * @returns {{ title: string, brand: string, generatedAt: string, lines: string[] }}
 */
export function buildDefaultPrintDocument() {
  const now = new Date()
  const generatedAt = new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now)

  return {
    title: printSettings.documentTitle,
    brand: brandingDefaults.appName,
    generatedAt,
    lines: [
      'این یک برگهٔ پیش‌فرض برای تست حالت چاپ است.',
      'در مرورگر از دیالوگ چاپ سیستم استفاده می‌شود.',
      'در اپ native از PrintManager اندروید استفاده می‌شود.',
    ],
  }
}
