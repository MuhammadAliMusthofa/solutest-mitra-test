# Frontend Solutest Mitra

Frontend **Solutest for Mitra** — platform tryout, bank soal, dan analitik hasil belajar untuk lembaga
mitra (dinas pendidikan, yayasan, bimbel). Dibangun ulang dari prototipe mitra di `fe-solutest`
(branch `feature/mitra-tenant`) dengan tampilan & menu yang sama, ditambah role **Guru** dan
**kustomisasi logo & tema per mitra**.

| Role (klaim JWT `role`) | Prefix | Ringkas |
| --- | --- | --- |
| `admin-mitra` | `/admin` | Ringkasan, analitik (sekolah, siswa, regional, butir soal, indikator), progres, paket soal, jadwal tryout, siswa (+ import), guru, **Pengaturan Mitra** (logo & tema), profil |
| `guru-mitra` | `/guru` | Subset admin: ringkasan, detail siswa, progres siswa, butir soal, indikator (hanya sekolah yang diampu), paket soal, jadwal tryout, profil |
| `siswa-mitra` | `/siswa` | Beranda, tryout (kerjakan · simpan · lanjutkan · kumpulkan), riwayat, pembahasan, laporan performa, leaderboard, profil |

Detail fitur per role: [docs/fitur-dan-role.md](docs/fitur-dan-role.md).

## Tech stack

- **Next.js 16** (App Router, Cache Components + Partial Prefetching, `proxy.ts`), **React 19**, TypeScript
- **Tailwind CSS 4** + **shadcn/ui (Radix)** — token warna via CSS variable (bisa diganti per mitra)
- **TanStack Query 5** (server state) · **Zustand 5** (client state: sesi, store ujian)
- Axios, Zod + React Hook Form, Recharts (via shadcn chart), React Leaflet, Tiptap, SheetJS
- **Node.js 24** (CI/CD & Docker), npm

## Menjalankan di lokal

Prasyarat: Node.js 24 (lihat `.nvmrc`; Node ≥ 20.9 juga bisa untuk dev, tapi CI memakai 24).

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Buka <http://localhost:3100>. Dengan `NEXT_PUBLIC_MOCK=true` (bawaan) semua request API dijawab
**mock adapter** di browser — tanpa backend. Akun uji (password `mitra123`):

| Email | Role |
| --- | --- |
| `admin@mitra.test` | Admin mitra |
| `guru@mitra.test` | Guru (3 sekolah) |
| `siswa@mitra.test` | Siswa |

Data simulasi disimpan di `localStorage` browser (paket, jadwal, pengerjaan, guru, tema) sehingga
tryout yang dijadwalkan admin langsung bisa dikerjakan siswa di browser yang sama. Kembalikan ke
kondisi awal lewat **Paket Soal → Reset data simulasi**.

Untuk backend asli (`be-solutest-mitra`): set `NEXT_PUBLIC_MOCK=false` dan `NEXT_PUBLIC_API_URL`.
Kontrak endpoint: [docs/api-contract.md](docs/api-contract.md).

## Script

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server (port 3100; otomatis naik ke 3101, 3102, … jika sudah dipakai) |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint (aturan di `eslint.config.mjs`) |
| `npm run fm:check` / `fm:fix` | Prettier |
| `npm run check` | typecheck + lint + format (dipakai sebelum PR) |
| `npm run ui:add <komponen>` | Tambah komponen shadcn/ui ke `src/components/ui` |

## Struktur singkat

```
src/
  app/          routing saja (page.tsx tipis: metadata + Suspense + container)
  components/   komponen GLOBAL (ui shadcn, layout, data-display, form, charts, feedback, providers)
  sections/     modul fitur (components · container · hooks · helpers per modul)
  services/     pemanggil endpoint backend
  models/       tipe data / kontrak API
  config/       env, role, path, menu, tema
  core/         http (axios + refresh token), token, query client
  state/        store Zustand global (sesi, ujian)
  hooks/ utils/ mocks/
```

Penjelasan lengkap & aturan komponen global vs per modul:
[docs/arsitektur-dan-folder.md](docs/arsitektur-dan-folder.md) · Coding rules:
[docs/coding-rules.md](docs/coding-rules.md).

## CI/CD

- `.github/workflows/ci.yml` — setiap PR/push: Node 24, `npm ci`, typecheck, lint (0 warning), Prettier, build.
- `.github/workflows/deploy-cloud-run.yml` — push ke `main`: build image Docker (Node 24, output
  standalone) → Artifact Registry → Cloud Run. Secrets: `GCP_*`, `NEXT_PUBLIC_API_URL`,
  `DISCORD_WEBHOOK` (opsional); variables: `NEXT_PUBLIC_MOCK`, `NEXT_PUBLIC_APP_NAME`.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 -t fe-solutest-mitra .
docker run -p 8080:8080 fe-solutest-mitra
```
