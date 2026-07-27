/** Promise delay — برای APIهای شبیه‌سازی‌شده */
export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
