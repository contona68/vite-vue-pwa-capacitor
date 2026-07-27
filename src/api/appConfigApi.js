/**
 * API شبیه‌سازی‌شده کانفیگ اپ
 * خواندن/نوشتن فقط از localStorage (به‌جای سرور)
 */

import { createDefaultAppConfig } from '@/config'
import { delay } from '@/utils/delay'

const STORAGE_KEY = 'app_runtime_config_v1'

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base
  const result = { ...base }
  Object.keys(patch).forEach((key) => {
    const value = patch[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(base[key] && typeof base[key] === 'object' ? base[key] : {}, value)
    } else if (value !== undefined) {
      result[key] = value
    }
  })
  return result
}

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

function writeToStorage(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/** معادل GET /api/app-config — فقط از storage می‌خواند */
export async function apiFetchAppConfig() {
  await delay(120)
  const defaults = createDefaultAppConfig()
  const stored = readFromStorage()
  if (!stored) {
    return defaults
  }
  return deepMerge(defaults, stored)
}

/** معادل PUT /api/app-config — در storage ذخیره می‌کند تا GET بعدی همان را بخواند */
export async function apiUpdateAppConfig(partialConfig) {
  await delay(120)
  const current = await apiFetchAppConfig()
  const next = deepMerge(current, partialConfig)
  writeToStorage(next)
  return next
}

export async function apiResetAppConfig() {
  await delay(120)
  localStorage.removeItem(STORAGE_KEY)
  return createDefaultAppConfig()
}
