/**
 * Navigation — وب / PWA
 * بک سخت‌افزاری نداریم؛ فقط API مشترک navigateBack.
 */

export function startBackHandling(onBackRequest) {
  // در وب دکمهٔ سیستم نداریم
  void onBackRequest
  return () => {}
}
