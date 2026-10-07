# Coding Rules

Mengikuti aturan `fe-solutest` (airbnb-style, perfectionist, unused-imports, Prettier) yang
disesuaikan ke ESLint flat config + `eslint-config-next`. Konfigurasi: `eslint.config.mjs`,
`prettier.config.mjs`. Jalankan `npm run check` sebelum membuat PR — CI menolak warning lint.

## Format & lint

- Prettier: `singleQuote`, `semi`, `printWidth: 100`, `trailingComma: es5`, `endOfLine: lf`, plugin
  pengurut class Tailwind (`cn()` / `cva()` ikut diurutkan).
- Import diurutkan **perfectionist** berdasarkan panjang baris, dipisah per kelompok:
  style → type → eksternal → `components/ui` → `config` → `core` → `hooks` → `utils`/`lib` → `state`
  → internal lain (`services`, `models`) → `components` → `sections` → `mocks` → relatif.
  Cukup jalankan `npm run lint:fix`.
- Alias import `src/*` (sama dengan fe-solutest), bukan `@/`.
- `@typescript-eslint/consistent-type-imports`: gunakan `import type` untuk tipe.
- File `src/components/ui/**` (shadcn) dikecualikan dari aturan urutan import agar mudah di-update.

## Penamaan

| Hal | Aturan | Contoh |
| --- | --- | --- |
| File & folder | kebab-case | `paket-list-container.tsx`, `use-exam-flow.ts` |
| Komponen | PascalCase, named export | `export function PaketListContainer()` |
| Container halaman | `<Nama>Container` | `JadwalTryoutContainer` |
| Hook | `use<Nama>` | `useAutoSave`, `useTenant` |
| Store Zustand | `use<Nama>Store` | `useExamAnswerStore` |
| Service | objek `<domain>Service` | `paketService.detail(id)` |
| Konstanta | UPPER_SNAKE | `SISWA_PATHS`, `DEFAULT_THEME` |
| Bahasa UI | Bahasa Indonesia; identifier kode bahasa Inggris (kecuali istilah domain: `paket`, `jadwal`, `guru`) | |

## Pola wajib

1. **Halaman tipis.** `app/**/page.tsx` hanya `metadata` + `<Suspense fallback={<PageLoader />}>` +
   satu container. Logika di container/hook.
2. **Data server = TanStack Query.** Query key diawali domain: `['analytics', ...]`, `['paket', ...]`,
   `['student', ...]`. Mutasi memanggil `invalidateQueries` domain terkait dan menampilkan toast
   (`sonner`) sukses/gagal memakai `errorMessage(err)`.
3. **State UI lintas halaman = Zustand** di `src/state`. Persist hanya untuk data yang memang harus
   selamat dari refresh (jawaban ujian). Preferensi kecil per perangkat boleh `localStorage` dengan
   `try/catch`.
4. **Filter di URL.** Filter/paginasi daftar disimpan dengan `useUrlState({ ... })` agar bisa dibagikan
   & bertahan saat refresh. Mengubah filter otomatis kembali ke halaman 1.
5. **Endpoint hanya di `src/services`.** Komponen/hook tidak memanggil axios langsung.
6. **Tautan dari config.** Gunakan `panelPaths(panel)` / `SISWA_PATHS` / `withQuery()`; jangan menulis
   string path literal.
7. **Tiga keadaan data selalu ditangani:** loading (`Skeleton`/`PageLoader`), error (`ErrorState` +
   coba lagi), kosong (`EmptyState`). `DataTable` sudah menangani ketiganya.
8. **Tanpa setState di effect untuk sinkronisasi props** (aturan React Compiler). Gunakan penyesuaian
   state saat render (`if (prop !== prev) { setPrev(prop); setX(...) }`), `useSyncExternalStore`, atau
   `useEffectEvent` untuk callback di listener.
9. **Data khusus klien** (cookie, localStorage) dibaca lewat `useHydrated()` / hook global agar tidak
   terjadi hydration mismatch.

## Styling

- Tailwind + token tema: `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-brand-accent`,
  `bg-page`, `text-muted-foreground`, `text-success|warning|destructive|info`, `rounded-card`,
  `shadow-card`. **Dilarang hex langsung** di komponen (tema mitra tidak akan berlaku), kecuali palet
  chart/medali yang sengaja tetap.
- Gaya visual mengikuti prototipe mitra (Spike Admin): kartu putih radius 18, bayangan lembut, sidebar
  & topbar melayang, pill status ber-outline lembut.
- Gunakan `cn()` untuk class kondisional. Hindari style inline kecuali nilai dinamis (lebar bar, skala
  huruf).
- Status tidak boleh hanya warna: selalu ada teks/ikon (`StatusPill`, `PredicateBadge`, `TrendBadge`).
- Chart memakai komponen `src/components/charts` (palet tervalidasi untuk buta warna, legend untuk ≥ 2
  seri, tooltip bawaan).

## Aksesibilitas

- Tombol ikon wajib `aria-label`; elemen interaktif harus tombol/tautan asli.
- Form: setiap input punya `<Label htmlFor>` dan pesan error di bawahnya (`aria-invalid`).
- Gerakan menghormati `prefers-reduced-motion` (`motion-reduce:` / utilitas `.lift`).

## Git

- Branch: `feature/<nama>`, `fix/<nama>`; commit gaya Conventional Commits
  (`feat(paket-soal): ...`, `fix(ujian): ...`).
- PR ke `develop`/`main` harus lolos workflow **CI**.
