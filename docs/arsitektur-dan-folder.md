# Arsitektur & Struktur Folder

Mengadopsi arsitektur `fe-solutest` (feature-based `sections` + layer global, pola
Container/Presentational) dan menyesuaikannya ke Next.js 16 App Router.

## 1. Lapisan & alur data

```
app/ (route)  →  sections/<modul>/container  →  hooks (TanStack Query / Zustand)  →  services  →  core/http (axios)
                         │                                                                         │
                         └── components (global & modul) ← props ←─────── models (tipe) ←──────────┘
                                                                     mode mock: core/http → mocks/adapter
```

1. **`app/`** hanya routing: `page.tsx` = `metadata` + `<Suspense>` + satu container. Tidak ada logika.
2. **Container** (`sections/<modul>/container`) adalah otak halaman: membaca URL, memanggil hook data,
   mengatur state lokal, lalu meneruskan data ke komponen presentasional.
3. **Hook** (`sections/<modul>/hooks`, `src/hooks`) membungkus TanStack Query (server state) dan Zustand
   (client state).
4. **Service** (`src/services`) satu-satunya tempat endpoint ditulis; selalu lewat `api` dari `core/http`.
5. **Model** (`src/models`) = kontrak tipe dengan backend.
6. **Mock** (`src/mocks`) = backend palsu (axios adapter) saat `NEXT_PUBLIC_MOCK=true`. Service tidak
   tahu apakah sedang mock — mengganti ke backend asli cukup lewat env.

## 2. Struktur `src/`

| Folder | Isi | Aturan |
| --- | --- | --- |
| `app/` | Route Next.js: `admin/`, `guru/`, `siswa/(main)/`, `siswa/ujian/`, `login/` | Layout per role memasang `RoleGuard` + shell. Halaman tipis. |
| `components/` | **Komponen global** (lihat §3) | Tanpa pemanggilan API & tanpa logika bisnis modul. |
| `sections/` | **Modul fitur** (lihat §4) | Boleh memakai `components/` dan `sections/_global`. Antar modul hanya boleh impor helper/komponen yang memang bersama (mis. `ujian/hooks/use-exam-flow` dipakai `tryout-siswa`). |
| `services/` | `account`, `analytics`, `paket`, `member`, `student` | Mengembalikan `data` yang sudah di-unwrap. |
| `models/` | `api`, `auth`, `tenant`, `analytics`, `progress`, `schedule`, `member`, `question`, `exam`, `user` | Hanya tipe + konstanta enum kecil. |
| `config/` | `env`, `roles`, `paths`, `nav`, `theme`, `auth` | Tautan antar halaman memakai `panelPaths()` / `SISWA_PATHS`, bukan string literal. |
| `core/` | `http` (axios + refresh token proaktif & reaktif), `token` (cookie), `query-client` | |
| `state/` | Zustand global: `session-store`, `exam-store` (soal & jawaban, persist), `exam-ui-store` | Store khusus satu modul tetap di modulnya. |
| `hooks/` | Hook global: `use-session`, `use-tenant`, `use-panel`, `use-url-state`, `use-hydrated` | |
| `utils/` | Fungsi murni: `format`, `predicate`, `progress`, `theme`, `export` | Tanpa React. |
| `mocks/` | `data` (dataset analitik), `db` (localStorage), `seed`, `scoring`, `handlers/*`, `router`, `adapter` | Dimuat dinamis hanya saat mode mock. |
| `proxy.ts` | Redirect berbasis cookie/role sebelum render (Next 16: pengganti middleware) | Hanya UX; otorisasi tetap di backend. |

## 3. Komponen global (`src/components`)

Dipakai lintas modul, murni presentasi, tanpa memanggil service (kecuali uploader/editor yang memang
generik).

| Folder | Komponen |
| --- | --- |
| `ui/` | shadcn/ui (Radix) — **jangan diubah gaya per halaman**; ukuran kontrol sudah disesuaikan gaya Spike. Tambah lewat `npm run ui:add`. |
| `layout/` | `PanelShell` (sidebar + topbar admin/guru), `Sidebar`, `StudentShell` (navbar siswa), `BrandMark` (logo & nama mitra), `AccountMenu`, `RoleGuard`, `MockBadge` |
| `data-display/` | `PageHeader`, `SectionCard`, `KpiCard`/`StatTile`, `StatusPill`, `DataTable`, `TablePagination`, `FilterBar`, `UserAvatar`, `WelcomeCard`, `HtmlContent` (HTML tersanitasi) |
| `form/` | `SearchInput` (debounce), `SelectField`, `RichTextEditor` (Tiptap), `ImageUploader` |
| `charts/` | `BarChart`, `LineChart`, `DonutChart`, `Sparkline` + palet tervalidasi (`chart-types.ts`) |
| `feedback/` | `PageLoader`, `EmptyState`, `ErrorState` (coba lagi), `ConfirmDialog` |
| `providers/` | `AppProviders` (Query, Tooltip, Toaster, sesi + auto-refresh), `ThemeSync` (tema mitra → CSS variable) |
| `iconify/` | `Iconify` (ikon set `solar:*`, sama dengan fe-solutest) |

**Kapan komponen naik ke global?** Bila dipakai ≥ 2 modul *dan* tidak bergantung istilah domain
satu modul. Komponen domain yang dipakai beberapa modul (badge predikat, filter tryout) ditaruh di
`sections/_global/components`.

## 4. Modul (`src/sections/<modul>`)

Pola folder setiap modul (sama dengan fe-solutest):

```
sections/<modul>/
  components/   komponen khusus modul (presentasional)
  container/    komponen pintar per halaman (diimpor app/**/page.tsx)
  hooks/        query/mutation & logika modul
  helpers/      fungsi murni modul (validasi form, mapping, konstanta tampilan)
```

| Modul | Halaman |
| --- | --- |
| `auth` | Login bermerek mitra (+ akun demo saat mock) |
| `dashboard` | Ringkasan Utama (admin) / Ringkasan (guru) |
| `analitik` | Peringkat sekolah, detail siswa + hasil per soal, regional (peta), butir soal, indikator |
| `progres` | Progres sekolah/siswa antar tryout + detail tren |
| `paket-soal` | Daftar paket, detail, salin paket, editor soal 4 tipe (PG, PG Kompleks, Benar/Salah, Benar/Salah Kompleks) dengan gambar, hapus soal massal |
| `jadwal-tryout` | Jadwal + dialog jadwalkan (kode `SLT-XXXXXX-TKA`) |
| `manajemen-siswa` | Daftar siswa + import Excel/CSV |
| `manajemen-guru` | CRUD guru + sekolah yang diampu |
| `pengaturan-mitra` | Profil & logo mitra, tema warna (preset, warna, sidebar, sudut) + pratinjau |
| `profil` | Profil saya (semua role) |
| `tryout-siswa` | Beranda siswa, daftar & detail tryout, selesai, riwayat, pembahasan, laporan, leaderboard |
| `ujian` | **Engine pengerjaan** (lihat docs/fitur-dan-role.md §4) |
| `_global` | Komponen domain bersama: `PredicateBadge`, `TrendBadge`, `TryoutFilter` |

## 5. Routing & guard

- `proxy.ts`: `/` → beranda role atau `/login`; area `/admin|/guru|/siswa` tanpa token → `/login?next=`;
  role salah → beranda role-nya.
- `RoleGuard` (klien): lapis kedua untuk token kedaluwarsa di tab lama. Halaman tetap dirender
  (dibutuhkan validasi instant navigation Next 16) dan ditutup overlay sampai sesi valid.
- Admin & guru memakai **view yang sama**; tautan dibangun dari `usePanel().paths` sehingga satu
  container melayani `/admin/...` dan `/guru/...`. Data guru dibatasi backend (klaim `school_ids`).

## 6. Tema per mitra

Semua warna komponen memakai token (`bg-primary`, `text-muted-foreground`, `bg-brand-accent`, …) yang
didefinisikan di `src/app/globals.css`. `ThemeSync` membaca branding mitra (`GET /tenant/branding`),
menghitung warna teks yang kontras secara otomatis (`utils/theme.ts`), lalu menulis variabel CSS ke
`<html>`. Nilai terakhir di-cache di localStorage dan dipasang skrip `<head>` sebelum render pertama
(tanpa kedip). **Jangan menulis warna hex langsung di komponen** — kecuali palet chart & medali yang
sengaja tetap.

## 7. Hal khusus Next.js 16

- `cacheComponents` + `partialPrefetching` aktif. Komponen klien yang membaca URL (`useSearchParams`,
  `useParams`) harus berada di bawah `<Suspense>` — sudah diterapkan di setiap `page.tsx` & root layout.
- Data yang hanya ada di klien (cookie sesi, cache tenant) dibaca lewat `useHydrated()` agar render saat
  hydration identik dengan HTML server.
- Route tetap “tipis” agar Partial Prerender bisa membuat shell statis.
