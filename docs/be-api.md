# Catatan API be-solutest-mitra (dari "Solutest for Mitra — Panduan Integrasi Frontend")

Base: `https://<api-mitra>/api/v1` · staging: `https://be-solutest-mitra-staging-339930537017.asia-southeast2.run.app/api/v1`

## Konvensi
- Auth: `Authorization: Bearer <token>` dari `POST /auth/login`. Token 1 hari, TIDAK ada refresh token → 401 = ke login.
- Sukses: `{ success: true, code: 200, message: "Success", data, paging?: { page, total_item, total_page } }` (paging hanya di daftar; kunci lain mis. `summary` bisa di samping data).
- Error: `{ success: false, code, errors: "pesan" }` → tampilkan `errors` apa adanya.
- 400 validasi · 401 token → hapus token, login · 403 role/akun nonaktif · 404 · 409 bentrok (soal terkunci, email terdaftar) · 429 · 502 backend pusat gagal.
- Paging: `page` (mulai 1), `size` (default 10, maks 100).
- Tanggal ISO 8601 UTC. Boolean query sebagai string.
- Predikat dihitung backend (field `predicate` / `last_predicate` / `average_predicate`): Istimewa ≥ 85, Baik 70–84,99, Memadai 55–69,99, Kurang < 55. null bila belum dinilai/disembunyikan.

## Branding & login
- `GET /public/profile` (tanpa token) → `{ name, short_name, tagline, logo, primary_color, secondary_color, accent_color, website }` (null → default Solutest). Tampilkan "Powered by Solutest".
- `POST /auth/login` `{ email, password }` → `{ token, user }`. user: `{ id, email, full_name, phone, role: ADMIN|GURU|SISWA, school_id, school_name, nisn, class_name, is_active, created_by, createdAt }`. Error: 400 salah, 403 bukan anggota/nonaktif, 400 akun Erklika belum verifikasi, 429.
- Setelah login: ADMIN→dashboard admin, GURU→dashboard guru, SISWA→daftar tryout. Guru `school_id: null` → banner "Hubungi admin mitra…" dan nonaktifkan menu siswa.
- `GET /auth/me` → user sama. 401 → login; 403 → logout dgn pesan. Tidak ada logout/ganti password di app mitra.

## Admin (prefix /admin, role ADMIN)
- `GET /admin/profile` → `{ id, name, short_name, tagline, logo, primary_color, secondary_color, accent_color, address, phone, email, website, updatedAt }`
- `PUT /admin/profile` minimal satu field (short_name ≤ 24, tagline ≤ 255, warna #RGB/#RRGGBB, null mengosongkan)
- `POST /admin/uploads` multipart `file` → `{ path, url, mimetype, size }` (PNG, JPEG, WEBP, GIF, MP3, WAV, OGG, PDF ≤ 10 MB; SVG ditolak). url = proxy `/api/v1/storage/uploads/...` bisa dipakai di img tanpa token.
- `GET /admin/quota` → `{ guru: { limit, used }, siswa: { limit, used } }`
- `GET /admin/summary` → `{ total_school, total_teacher, total_student, total_package, schedules: { total, upcoming, active, ended }, quota }` (quota null bila pusat down). Guru: `GET /teacher/summary` → `{ school: { id, name }, total_student, schedules }`.
- Sekolah (dari circl):
  - `GET /admin/schools/search?q=&level=&provinceId=&cityId=&page=&size=` → item `{ ref_id, npsn, name, education_level, status, address, province_name, city_name, district_name, mitra_school_id }`
  - `POST /admin/schools` `{ ref_id, npsn }` (atau `name` bila NPSN kosong) — 409 sudah ada, 404 tidak ditemukan
  - `GET /admin/schools?search=&education_level=&page=&size=` → `{ id, ref_id, name, npsn, education_level, province_name, city_name, district_name, address, total_guru, total_siswa, createdAt }`
  - `DELETE /admin/schools/:id` (409 jika masih ada guru/siswa aktif)
- Guru:
  - `GET /admin/teachers?search=&school_id=&is_active=&page=&size=`
  - `POST /admin/teachers` `{ email, full_name, school_id, password?, phone? }` — password wajib (min 6) bila email belum punya akun Solutest; respons `is_new_account`.
  - Objek user: `{ id, email, full_name, phone, role, school_id, school_name, nisn, class_name, is_active, created_by, createdAt, is_new_account? }`
  - Error buat guru: 400 kuota penuh ("Kuota guru sudah penuh (50/50)."), 400 email sudah aktif di mitra, 400 akun baru tanpa password, 404 sekolah tidak ada. Mendaftarkan lagi email nonaktif = aktifkan kembali.
- Semua user:
  - `GET /admin/users?role=ADMIN|GURU|SISWA&school_id=&search=&is_active=&class_name=&page=&size=` (search: nama/email/NISN)
  - `GET /admin/users/:id` · `PUT /admin/users/:id` `{ school_id?, nisn?, class_name? }` · `PATCH /admin/users/:id/status` `{ is_active }` (cek kuota; tidak bisa ubah diri sendiri → 400). Nama & email tidak bisa diubah.
- Siswa (admin):
  - `GET /admin/students?search=&school_id=&class_name=&is_active=&page=&size=`
  - `POST /admin/students` `{ email, full_name, school_id, password?, phone?, nisn?, class_name? }`
  - `POST /admin/students/import` `{ school_id?, students: [{ email, full_name, password?, phone?, nisn?, class_name?, school_id? }] }` maks 200 baris/request
  - Guru: `POST /teacher/students/import` `{ students }` (sekolah = sekolah guru; school_id per baris → 400)
  - Item siswa + `total_tryout`, `last_score`, `last_predicate`, `last_submitted_at`.
  - Respons import: `{ summary: { total, created, existing_account, skipped, failed }, results: [{ row, email, status: created|existing_account|skipped|failed, user_id, error }] }`. Kuota dicek di awal (400 "Kuota siswa tidak cukup…"). ±200 baris/menit → progress, pecah file besar.

## Paket soal (admin; guru lihat bagian guru)
- `GET /admin/packages?search=&source=MITRA|SOLUTEST&page=&size=` → item + `total_question`, `total_schedule`
- `POST /admin/packages` · `GET /admin/packages/:id` (+ `is_editable`, `questions[]` dengan kunci) · `PUT` (minimal satu field) · `DELETE` (409 jika dipakai jadwal belum berakhir) · `POST /admin/packages/:id/duplicate` → "<judul> (Salinan)"
- Field paket: `title` (wajib ≤255), `class_id`, `subject_id` (wajib utk paket mentah), `description` (HTML/null), `time` (menit 1–1440, default 60), `show_score` (default true), `is_cheat_detection` (default false), `max_violations` (1–100, default 3).
- Respons + `id, code (PKT-XXXXXX), class_name, subject_name, source, source_package_id, created_by, createdAt, updatedAt`. Kelas & mapel tidak bisa diubah setelah ada soal (409).
- Master: `GET /admin/masters/classes` `[{id,name}]` · `/admin/masters/subjects` · `/admin/masters/competencies?package_id=` (atau class_id&subject_id) `[{id,name,class_id,subject_id}]` · `/admin/masters/sub-competencies?competency_id=` `[{id,name,competency_id}]`
- Soal: `POST /admin/packages/:id/questions` (order default terakhir+1) · `PUT /admin/questions/:id` (kirim LENGKAP; opsi & lampiran diganti, id opsi berubah) · `DELETE /admin/questions/:id`
- Objek soal: `{ id, order, question_text, description, type_question_id, type_question_name, level_question, text_content, text_image, competency_id, competency_name, sub_competency_id, sub_competency_name, source_question_id, options: [{ id, option_text, is_true, point, reason, order, file }], statements, attachments: [url], explain_attachments: [] }`
- Soal terkunci: setelah ada siswa mengerjakan, `is_editable=false` → tambah/ubah/hapus soal 409; tampilkan "Duplikat untuk diedit".
- competency_id & sub_competency_id WAJIB per soal (sesuai kelas & mapel paket; 400 bila tidak cocok).
- question_text, description, text_content, option_text, reason = HTML (sanitasi).
- Katalog Solutest: `GET /admin/catalog/packages?search=&page=&size=` (juga class_id, subject_id master Solutest) → item `{ id, code, title, description, time, class_id, class_name, subject_id, subject_name, category_id, category_name, total_question }` · `POST /admin/catalog/packages/:id/import` → paket mitra baru (201, `total_question`, `skipped_question`). Hanya tipe PG, PG Kompleks, B/S, B/S Kompleks. Import dua kali = dua salinan (konfirmasi bila `source_package_id` sudah ada).

## Jadwal tryout (admin)
- `GET /admin/schedules?status=upcoming|active|ended&search=&page=&size=` (urut start_at terbaru) · `POST /admin/schedules` · `GET /admin/schedules/:id` · `PUT /admin/schedules/:id` (minimal satu field) · `DELETE /admin/schedules/:id` (409 jika ada siswa sedang mengerjakan)
- Field: `package_id` (wajib, paket ≥1 soal), `title` (wajib ≤255), `description` (HTML/null), `start_at`, `end_at` (ISO UTC, end > start), `duration` (1–1440, default time paket), `max_attempts` (1–100, default 1), `is_published` (default true; false = draft), `school_ids` (int[], [] = semua sekolah; PUT: kirim = ganti seluruh target, tidak kirim = tetap)
- Objek: `{ id, code (SLT-XXXXXX-TKA), title, description, package_id, package: { id, title, time, class_name, subject_name }, start_at, end_at, duration, max_attempts, is_published, status, is_all_schools, schools: [{ id, name }], total_participant, total_submitted, total_in_progress, createdAt }`
- status dari waktu server: upcoming < start_at ≤ active ≤ end_at < ended. Batas waktu siswa = mulai + duration, maks end_at. package_id tidak bisa diganti setelah ada pengerjaan (409).
- Error: 400 "Waktu selesai harus setelah waktu mulai", 400 "Paket belum punya soal", 400 "Ada sekolah yang tidak ditemukan", 404 "Paket tidak ditemukan".

## Siswa (prefix /student, role SISWA)
- `GET /student/schedules` (tanpa status = aktif & akan datang, urut mulai terdekat; `?status=ended`) → `{ id, code, title, description, package: { id, title, subject_name, class_name, show_score }, start_at, end_at, duration, total_question, status, max_attempts, attempts_used, running_attempt_id, can_start }`
  - Tombol: upcoming → "Belum dimulai" + hitung mundur; active & running_attempt_id → "Lanjutkan"; active & can_start → "Mulai"; active & !can_start → "Sudah dikerjakan" (link riwayat).
- `GET /student/schedules/code/:code` (detail, kode case-insensitive) · `POST /student/schedules/code/:code/start` · `GET /student/schedules/:id`. 404 "Kode tryout tidak ditemukan atau tidak ditujukan untuk sekolah Anda".
- Mulai/lanjutkan `POST /student/schedules/:id/start` → sesi (melanjutkan attempt berjalan bila ada). Setelah reload: `GET /student/attempts/:attemptId/session` (respons sama).
  - Sesi: `{ attempt_id, schedule_id, package: { id, title, subject_name, class_name }, started_at, deadline_at, server_time, is_cheat_detection, max_violations, current_violations, total_question, questions: [{ id, question_text, type_question_id, type_question_name, text_content, text_image, attachments, options: [{ id, option_text, order, file }], statements? }], draft: [{ question_id, answer, duration_seconds }] }`
  - Tanpa kunci; urutan sudah diacak server. Error 400 "Tryout belum dimulai"/"Tryout sudah berakhir"/"Kesempatan mengerjakan sudah habis (1/1)"; 404.
- Timer: offset = Date.parse(server_time) − Date.now(); sisa = Date.parse(deadline_at) − (Date.now() + offset). 0 → submit otomatis. Toleransi server 2 menit.
- Draft `POST /student/attempts/:id/draft` `{ answers: [{ question_id, answer, duration_seconds }] }` → `{ saved, total_answered }`. Kirim hanya yang berubah (server merge). Debounce 3–5 dtk + saat pindah soal. `answer: null`/[] = kosongkan. Simpan juga di localStorage, kirim ulang saat online.
- Submit `POST /student/attempts/:id/submit` (body sama, semua jawaban) → `{ attempt_id, submitted, is_late }`; kedua kali 400 "Pengerjaan sudah selesai".
- Pelanggaran `POST /student/attempts/:id/violation` `{ violation_type: TAB_SWITCH|EXIT_FULLSCREEN|COPY_PASTE|…, note? }` → `{ current_violations, max_violations, is_cheat_detection, auto_ended }`. auto_ended → hentikan ujian, ke hasil. Simpan draft dulu sebelum kirim pelanggaran. Tutup browser tanpa submit → server kumpulkan otomatis (`is_auto_ended`).
- Hasil `GET /student/attempts/:id` → `{ attempt_id, schedule: { id, title, end_at }, package: { id, title }, started_at, submitted_at, is_auto_ended, is_processed, score, predicate, total_correct, review_available, questions }`. is_processed false → "Nilai sedang dihitung", polling 2–3 dtk (maks ±30 dtk). score null bila show_score false. Pembahasan setelah jadwal berakhir (review_available). Belum submit → 403.
- Leaderboard `GET /student/schedules/:id/leaderboard?scope=all|school&limit=1-100` → `{ data: [{ rank, user_id, full_name, class_name, school: { id, name }, score, predicate, duration_seconds, is_me }], schedule: { id, title, status }, scope, total_participant, me }`. show_score false → 403.
- Riwayat `GET /student/history` → data `[{ attempt_id, schedule: { id, title }, package: { id, title, subject_name }, started_at, submitted_at, is_auto_ended, is_processed, score, predicate }]` + `summary: { total_attempt, total_scored, average_score, average_predicate, highest_score }` + paging.
