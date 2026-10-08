// Semua variabel environment dibaca sekali di sini; komponen tidak menyentuh process.env langsung.
// NEXT_PUBLIC_* di-inline saat build, jadi harus dirujuk dengan nama lengkap (bukan dinamis).

export const ENV = {
  /** Base URL backend be-solutest-mitra, tanpa trailing slash. */
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100/api/v1').replace(/\/$/, ''),
  /**
   * true → endpoint analitik & progres dijawab data simulasi (src/mocks) untuk demo.
   * false (bawaan) → analitik dari backend asli. Endpoint lain selalu ke backend asli.
   */
  mock: process.env.NEXT_PUBLIC_MOCK === 'true',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Solutest Mitra',
  isProduction: process.env.NODE_ENV === 'production',
};
