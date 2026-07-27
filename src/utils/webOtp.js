/**
 * Web OTP API (عمدتاً Android Chrome)
 * SMS باید شامل دامنه و کد باشد، مثلاً:
 * کد ورود: 123456
 *
 * @contona68.github.io #123456
 */
export function isWebOtpSupported() {
  return typeof window !== 'undefined' && 'OTPCredential' in window
}

/** تبدیل ارقام فارسی/عربی و استخراج کد از متن Web OTP */
export function normalizeOtpCode(value, maxLength = 6) {
  const persian = '۰۱۲۳۴۵۶۷۸۹'
  const arabic = '٠١٢٣٤٥٦٧٨٩'
  let text = String(value ?? '')

  text = text
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))

  const fromHash = text.match(/#\s*([0-9]{4,8})/)
  if (fromHash) {
    return fromHash[1].slice(0, maxLength)
  }

  return text.replace(/\D/g, '').slice(0, maxLength)
}

export async function waitForSmsOtp(signal) {
  if (!isWebOtpSupported()) {
    return null
  }

  const credential = await navigator.credentials.get({
    otp: { transport: ['sms'] },
    signal,
  })

  if (!credential) {
    return null
  }

  // بعضی مرورگرها فقط .code می‌دهند؛ خام را برمی‌گردانیم تا خودمان نرمال کنیم
  const raw = credential.code == null ? '' : String(credential.code)
  console.info('[WebOTP] received raw:', raw)

  return raw || null
}
