# Kontrak API — be-solutest-mitra

FE dibangun di atas kontrak ini. Selama backend belum siap, FE berjalan dengan `NEXT_PUBLIC_MOCK=true`;
implementasi acuan (bentuk request/response & aturan validasi) ada di `src/mocks/handlers/*` dan
tabel route `src/mocks/router.ts`. Tipe TypeScript: `src/models/*`.

## 1. Konvensi

- Base URL: `NEXT_PUBLIC_API_URL` (mis. `https://api.mitra.solutest.id/api/v1`).
- Envelope: `{ "success": true, "data": <T>, "message"?: "..." }`. Endpoint paginasi:
  `{ "success": true, "data": T[], "pagination": { current_page, per_page, total_items, total_pages }, ...extra }`.
- Error: HTTP 4xx/5xx dengan `{ "success": false, "message": "...", "errors"?: { field: [msg] } }`.
  `message` ditampilkan apa adanya ke pengguna (Bahasa Indonesia).
- Paginasi: query `page` (mulai 1), `per_page`. Pencarian: `search`.
- Auth: `Authorization: Bearer <JWT>` untuk semua endpoint 🔒. **Tenant diambil dari JWT** — FE tidak
  pernah mengirim `tenant_id`. 401 → FE mencoba refresh sekali lalu logout.

## 2. JWT

```json
{
  "id": 201,
  "email": "guru@mitra.test",
  "full_name": "Bu Ratna Kusuma",
  "role": "guru-mitra",              // admin-mitra | guru-mitra | siswa-mitra
  "tenant": { "id": "tnt_01", "name": "Dinas Pendidikan Kota Tegal", "slug": "kota-tegal" },
  "school_ids": [101, 102, 103],     // hanya guru: sekolah yang diampu (scope analitik)
  "image_profile": null,
  "exp": 1760000000
}
```

FE menyimpan access token di cookie `st_token` (dibaca `proxy.ts` untuk redirect) dan refresh token di
localStorage. Refresh dijadwalkan ~60 detik sebelum `exp` dan saat 401.

## 3. Auth, branding, profil

| Method | Path | Role | Body / Query → `data` |
| --- | --- | --- | --- |
| POST | `/auth/login` | publik | `{ email, password }` → `{ token, refresh_token }`. 401 salah kredensial, 403 akun nonaktif |
| POST | `/auth/refresh` | 🔒 (token boleh hampir/sudah exp) | `{ refresh_token }` → `{ token, refresh_token }` (klaim terbaru) |
| POST | `/auth/logout` | 🔒 | – |
| GET | `/tenant/branding` | **publik** (tenant dari host/subdomain) | `TenantBranding` |
| PUT | `/tenant/branding` | admin | `UpdateTenantBody` (sebagian field; `theme` digabung) → `TenantBranding` |
| GET | `/me` | 🔒 | `UserProfile` |
| PUT | `/me` | 🔒 | `UpdateProfileBody` → `UserProfile` (email tidak bisa diubah) |
| POST | `/me/password` | 🔒 | `{ current_password, new_password (≥ 8) }`; 422 bila password lama salah |
| POST | `/uploads` | 🔒 | multipart `file` (PNG/JPG/WEBP/SVG ≤ 2 MB) → `{ url }` |

`TenantBranding`:

```json
{
  "id": "tnt_01", "name": "Dinas Pendidikan Kota Tegal", "short_name": "Disdik Tegal",
  "tagline": "Tryout & analitik hasil belajar siswa Kota Tegal", "logo_url": "https://…/logo.png",
  "theme": {
    "primary": "#3F479E", "secondary": "#8A68AC", "accent": "#B3C966", "background": "#F3F2FA",
    "success": "#1A8A55", "warning": "#B5650C", "danger": "#C4472A",
    "radius": 12, "sidebar": "light"          // light | brand | dark
  },
  "updated_at": "2026-10-07T03:00:00Z"
}
```

Validasi backend: warna `#RRGGBB`, `radius` 0–24, `name` wajib.

## 4. Analitik (admin & guru) 🔒

Semua menerima `code` opsional (`SLT-XXXXXX-TKA`; kosong = semua tryout tenant). Untuk **guru**, data
dibatasi ke `school_ids` dari JWT; `code` milik tenant lain → 403.

| Method | Path | Query → `data` |
| --- | --- | --- |
| GET | `/analytics/tryout-options` | → `TryoutOption[]` (terbaru dulu) |
| GET | `/analytics/dashboard/kpi` | → `DashboardKpi` (tren = per tryout) |
| GET | `/analytics/dashboard/participant-trend` | → `CategoryChart` (series Peserta, Selesai) |
| GET | `/analytics/dashboard/score-distribution` | → `{ labels, data }` (0-20 … 81-100) |
| GET | `/analytics/dashboard/subject-average` | → `{ subjects: [{ name, average }] }` |
| GET | `/analytics/dashboard/completion` | → `{ completion_rate, total_completed, total_incomplete }` |
| GET | `/analytics/dashboard/answer-summary` | → `CategoryChart` (series Benar, Salah, Kosong; %) |
| GET | `/analytics/dashboard/top-students` | → `DashboardTopStudent[]` (5, unik per siswa) |
| GET | `/analytics/schools/ranking` | `search, jenjang, page, per_page` → paginasi `SchoolRankingItem` |
| GET | `/analytics/schools/:id/subjects` | → `SchoolSubjectsResponse` |
| GET | `/analytics/students` | `search, school_id, page, per_page` → paginasi `StudentDetailItem` + `filter_options` |
| GET | `/analytics/practices/:practiceId` | → `PracticeDetail` (jawaban per soal) |
| GET | `/analytics/regional/summary` | → `RegionalSummary` |
| GET | `/analytics/regional/map` | → `{ locations: MapLocation[] }` |
| GET | `/analytics/regional/regions` | → `{ regions: RegionData[] }` |
| GET | `/analytics/regional/heatmap` | → `RegionalHeatmap` |
| GET | `/analytics/regional/schools` | `wilayah, page, per_page` → paginasi `RegionalSchool` + `region_list` |
| GET | `/analytics/items` | `subject, difficulty (MUDAH/SEDANG/SULIT), page` → paginasi `ItemAnalysisQuestion` + `summary`, `subjects` |
| GET | `/analytics/indicators/filters` | → `{ subjects, jenjang }` |
| GET | `/analytics/indicators/summary` | `subject, jenjang` → `{ total_sekolah, total_peserta }` |
| GET | `/analytics/indicators/hierarchy` | `subject, jenjang` → `{ competencies: CompetencyNode[] }` |
| GET | `/analytics/indicators/questions` | `question_ids=1,2` → `SampleQuestion[]` |

Ekspor Excel/CSV dibuat di FE dari endpoint list (`per_page` besar), jadi tidak butuh endpoint ekspor.

## 5. Progres antar tryout 🔒 (admin; guru hanya siswa)

Skor = skor akhir tryout yang sudah dikumpulkan, kronologis per `start_date`. Status: delta terakhir vs
sebelumnya `> 2` naik, `< −2` turun, selain itu stabil, `< 2` tryout `kurang-data`.

| Method | Path | Query → `data` |
| --- | --- | --- |
| GET | `/progress/schools` | `search, status (naik/stabil/turun/kurang-data), page, per_page` → paginasi `SchoolProgressItem` |
| GET | `/progress/schools/:id` | → `SchoolProgressDetail` (points + students) |
| GET | `/progress/students` | `search, status, school_id, page, per_page` → paginasi `StudentProgressItem` |
| GET | `/progress/students/:id` | → `StudentProgressDetail` (points + school_average) |

## 6. Master, paket soal, jadwal 🔒 (admin & guru)

| Method | Path | Body / Query → `data` |
| --- | --- | --- |
| GET | `/master/classes` · `/master/subjects` · `/master/categories` | → `{ id, name }[]` |
| GET | `/master/competencies` | `class_id, subject_id` (kelas & mapel paket) → `CompetencyOption[]` (`id, code, name, class_id, subject_id, order`) |
| GET | `/master/sub-competencies` | `competency_id` → `SubCompetencyOption[]` (`id, code, name, competency_id, order`) |
| GET | `/master/indicators` | `sub_competency_id` → `IndicatorOption[]` (`id, code, name, sub_competency_id, order`) |
| GET | `/packages` | `search, subject_id, page, per_page` → paginasi `Package` |
| GET | `/packages/options` | → `PackageOption[]` (paket berisi soal, untuk jadwal) |
| POST | `/packages` | `PackageBody` → `Package` (`code` dibuat backend, unik) |
| GET | `/packages/:id` | → `PackageDetail` (questions dengan kunci) |
| PUT | `/packages/:id` | `PackageBody` → `Package` |
| DELETE | `/packages/:id` | 422 bila sudah dipakai jadwal |
| POST | `/packages/:id/questions` | `QuestionBody` → `Question` |
| GET/PUT/DELETE | `/packages/:id/questions/:qid` | `QuestionBody` → `Question` |
| POST | `/packages/:id/duplicate` | → `Package` baru (judul `Salinan — …`, kode baru, semua soal ikut disalin dengan id baru) |
| POST | `/packages/:id/questions/bulk-delete` | `{ question_ids: number[] }` → hapus massal soal dari paket |
| GET | `/schedules` | `search, status (scheduled/ongoing/finished), page` → paginasi `TryoutSchedule` (status dihitung dari waktu) |
| POST | `/schedules` | `CreateTryoutScheduleBody` → `TryoutSchedule` dengan `code` baru `SLT-XXXXXX-TKA` |
| DELETE | `/schedules/:id` | hanya status `scheduled` |

Tipe soal hanya 4: `1` PG, `2` PG Kompleks, `3` Benar/Salah, `4` Benar/Salah Kompleks (tabel). Soal dibuat
manual (tanpa generate); gambar soal dikirim di `attachments` (`type: image`). Validasi: teks soal atau gambar
wajib; PG/Benar-Salah tepat 1 kunci; PG Kompleks ≥ 1 kunci; B/S Kompleks ≥ 2 pernyataan, tiap opsi = satu
baris tabel dengan `is_true` = kunci Benar (`false` = Salah), urut `order`.
Paket hanya menyimpan `title, class_id, subject_id` (tanpa bab). Tiap soal menyimpan `competency_id`,
`sub_competency_id` & `indicator_id` (opsional, berjenjang: kompetensi → sub kompetensi → indikator;
sub kompetensi harus milik kompetensi, indikator milik sub kompetensi); respons `Question` menyertakan
`competency_name`, `sub_competency_name` & `indicator_name`.

## 7. Anggota mitra 🔒 (admin)

| Method | Path | Body / Query → `data` |
| --- | --- | --- |
| GET | `/schools` | → `SchoolOption[]` (guru: hanya sekolah diampu) |
| GET | `/students` | `search, jenjang, page, per_page` → paginasi `MitraStudent` |
| POST | `/students/import` | `{ students: ImportStudentRow[] }` (≤ 1000) → `{ created, skipped, errors: [{ row, email, message }] }` |
| GET | `/teachers` | `search, status, page, per_page` → paginasi `MitraTeacher` |
| POST | `/teachers` | `TeacherBody` (password ≥ 8 wajib) → `MitraTeacher` |
| PUT | `/teachers/:id` | `TeacherBody` (password opsional) → `MitraTeacher` |
| DELETE | `/teachers/:id` | – |

## 8. Siswa: tryout & pengerjaan 🔒 (siswa)

| Method | Path | Body / Query → `data` |
| --- | --- | --- |
| GET | `/student/tryouts` | → `StudentTryout[]` (semua jadwal tenant + status, `is_done`, `unfinished_practice_id`, `score`) |
| GET | `/student/tryouts/:code` | → `TryoutDetail`; 404 kode tidak valid |
| POST | `/student/tryouts/:code/start` | → `ExamSession`. Bila sudah mulai & belum kumpul → kembalikan practice yang sama. 422: belum dimulai / sudah berakhir / sudah dikerjakan |
| GET | `/student/practices/unfinished` | → `UnfinishedPractice[]` |
| GET | `/student/practices/:id/resume` | → `ExamSession` (soal tanpa kunci) |
| GET | `/student/practices/:id/answers` | → `SavedAnswer[]` (`answer` boleh string JSON — FE menormalisasi) |
| POST | `/student/practices/:id/answers` | `{ answers: AnswerPayloadItem[] }` — simpan sementara (idempoten, timpa seluruh jawaban) |
| POST | `/student/practices/:id/submit` | `{ answers }` → `{ practice_id, score }`; 422 bila sudah dikumpulkan |
| POST | `/student/practices/:id/violations` | `{ reason, count, occurred_at }` — log deteksi kecurangan |
| GET | `/student/history` | `page, per_page` → paginasi `HistoryItem` |
| GET | `/student/practices/:id/explanation` | → `Explanation` (setelah dikumpulkan) |
| GET | `/student/practices/:id/report` | → `PerformanceReport` |
| GET | `/student/leaderboard/options` | → `LeaderboardTryoutOption[]` |
| GET | `/student/leaderboard/:packageId` | `search, page` → paginasi `LeaderboardRow` + `my_rank` (peserta tenant saja) |
| GET | `/regions/provinces` · `/regions/cities?province_id` · `/regions/schools?city_id&search` | → `{ id, name }[]` |

`ExamSession`:

```json
{
  "practice_id": 100113, "package_id": 7101, "code": "SLT-805512-TKA", "title": "Tryout TKA #5",
  "subjects": [{ "id": 5, "name": "Bahasa Indonesia" }],
  "sections": [{ "subject_id": 5, "subject_name": "Bahasa Indonesia", "questions": [ExamQuestion] }],
  "start_time": "2026-10-07T03:49:00Z",  // waktu siswa mulai (tetap saat resume)
  "end_time": "2026-10-21T14:00:00Z",    // akhir jadwal
  "duration": 90,                        // menit
  "total": 18, "is_cheat_detection": true, "max_violations": 3
}
```

Tenggat dihitung FE = min(`start_time` + `duration`, `end_time`); backend wajib menolak submit/simpan
setelah tenggat + toleransi kecil dan mengumpulkan otomatis pengerjaan yang melewati tenggat.

Penilaian per tipe mengikuti `src/mocks/scoring.ts` (PG/Benar-Salah/PG Kompleks 0 atau 100; Benar/Salah
Kompleks proporsional per pernyataan yang tepat).
