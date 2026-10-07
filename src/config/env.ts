// Semua variabel environment dibaca sekali di sini; komponen tidak menyentuh process.env langsung.
// NEXT_PUBLIC_* di-inline saat build, jadi harus dirujuk dengan nama lengkap (bukan dinamis).

export const ENV = {
  /** Base URL backend be-solutest-mitra, tanpa trailing slash. */
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, ''),
  /** true → request API dijawab mock adapter (lihat src/mocks). */
  mock: process.env.NEXT_PUBLIC_MOCK !== 'false',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Solutest Mitra',
  isProduction: process.env.NODE_ENV === 'production',
};
