/**
 * تنظیمات WebAuthn (مسیر وب / PWA)
 */
export const webAuthnSettings = {
  rpName: 'هایپریک',
  /** طول پیش‌فرض challenge (بایت) */
  challengeByteLength: 32,
  timeoutMs: 120_000,
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    userVerification: 'required',
    residentKey: 'discouraged',
  },
  attestation: 'none',
}
