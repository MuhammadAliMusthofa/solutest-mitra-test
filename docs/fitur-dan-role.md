# Fitur & Role

## 1. Admin Mitra (`admin-mitra`, `/admin`)

| Menu | Path | Isi |
| --- | --- | --- |
| Ringkasan Utama | `/admin` | Sapaan + filter tryout, KPI (peserta, rata-rata, sekolah) + sparkline, peserta & penyelesaian per tryout, tren skor, penyelesaian, distribusi nilai, rata-rata mapel, ringkasan jawaban, 5 siswa teratas |
| Sekolah & Siswa | `/admin/analitik/sekolah`, `/admin/analitik/siswa` | Peringkat sekolah (baris dibuka → nilai per mapel), detail siswa (+ hasil per soal `/hasil/[practiceId]`), ekspor Excel/CSV |
| Analisis Regional | `/admin/analitik/regional` | KPI, peta sebaran (Leaflet), perbandingan wilayah vs rata-rata, tabel wilayah, sekolah per wilayah |
| Progres Tryout | `/admin/progres/sekolah`, `/admin/progres/siswa` | Status Naik / Stabil (±2) / Turun / Data belum cukup, detail tren total & per mapel, perubahan predikat |
| Analisis Butir Soal | `/admin/analitik/soal` | Ringkasan mudah/sedang/sulit, persentase benar-salah-kosong per soal, pembahasan |
| Analisis Indikator | `/admin/analitik/indikator` | Kompetensi → sub-kompetensi → indikator dengan level capaian + contoh soal |
| Paket Soal | `/admin/paket-soal` | CRUD paket (kode paket otomatis), editor soal 6 tipe, generate dari bank soal |
| Jadwal Tryout | `/admin/jadwal-tryout` | Jadwalkan (paket, waktu, durasi, deteksi kecurangan) → kode `SLT-XXXXXX-TKA` |
| Siswa | `/admin/siswa` (+ `/import`) | Daftar siswa mitra, import batch .xlsx/.csv (template, validasi per baris, hasil) |
| Guru | `/admin/guru` | **Baru.** Tambah/ubah/hapus guru, sekolah yang diampu, aktif/nonaktif |
| Pengaturan Mitra | `/admin/pengaturan` | **Baru.** Nama, nama singkat, tagline, **logo**; **tema**: preset, warna utama/sekunder/aksen/latar/sukses/peringatan/bahaya, gaya sidebar, sudut komponen, pratinjau langsung, peringatan kontras |
| Profil Saya | `/admin/profil` | Identitas, ubah profil & foto, ganti password |

Predikat: Kurang < 33.33 ≤ Memadai < 56.67 ≤ Baik < 72.5 ≤ Istimewa. Filter tryout `?code=` kosong =
semua tryout mitra.

## 2. Guru (`guru-mitra`, `/guru`) — **role baru**

Subset admin. Semua analitik **dibatasi ke sekolah yang diampu** (klaim JWT `school_ids`, ditegakkan
backend):

Ringkasan · Detail Siswa (+ hasil) · Progres Siswa · Analisis Butir Soal · Analisis Indikator ·
Paket Soal · Jadwal Tryout · Profil. Tidak ada: Regional, Peringkat/Progres Sekolah, Siswa (import),
Guru, Pengaturan Mitra.

## 3. Siswa (`siswa-mitra`, `/siswa`)

Navbar (tanpa sidebar) dengan **logo & nama mitra**.

| Menu | Path | Isi |
| --- | --- | --- |
| Beranda | `/siswa` | Sapaan, gabung dengan kode, **Tryout belum selesai → Lanjutkan**, tryout aktif/terjadwal, statistik skor |
| Tryout | `/siswa/tryout`, `/siswa/tryout/[code]` | Daftar (filter status), detail + aturan + konfirmasi data diri → **Mulai** |
| Pengerjaan | `/siswa/ujian/[practiceId]/[nomor]`, `/konfirmasi` | Engine ujian (§4) |
| Riwayat | `/siswa/riwayat` | Skor, pembahasan, laporan performa |
| Leaderboard | `/siswa/leaderboard` | Podium 3 besar, peringkatku, pencarian |

## 4. Mekanisme pengerjaan tryout (disamakan dengan fe-solutest)

| Mekanisme | Implementasi |
| --- | --- |
| Store soal & jawaban | `useExamSessionStore` (padanan `to-qn-store`) & `useExamAnswerStore` (padanan `latihan-soal-jawaban-siswa-store`), **persist localStorage** → refresh/tutup tab tidak menghilangkan jawaban |
| Format jawaban | PG/Benar-Salah `["id"]`, PG Kompleks `["id",…]`, Menjodohkan `[[pernyataanId, jawabanId]]`, Isian `["teks",…]`, Esai `["teks"]`; tiap entri menyimpan `isCompleted`, `isDoubt`, `index`, `duration_seconds` |
| Nomor soal di URL | hashids dengan salt & alfabet yang sama (`/siswa/ujian/[practiceId]/Z9GJZ0JYL7`) |
| Simpan sementara | Setiap pindah soal (sebelumnya/berikutnya/daftar nomor/keyboard ←→) → `POST /student/practices/:id/answers`. Tambahan pengaman: berkala 60 detik & saat tab disembunyikan; gagal simpan tidak memblokir siswa |
| Lanjutkan | Kartu "Tryout belum selesai" / tombol di detail → muat soal (`resume`) **wajib berhasil** sebelum navigasi (fix Issue #1); jawaban tersimpan dimuat paralel & dinormalisasi (string JSON berlapis → array); gagal dimuat tidak memblokir |
| Deep link / pindah perangkat | Shell ujian memuat ulang sesi dari server bila store kosong atau milik practice lain |
| Timer | Tenggat = min(mulai + durasi, akhir jadwal), dihitung dari jam sistem tiap detik; ≤ 10 menit merah berkedip |
| Waktu habis | Saat mengerjakan → kumpul otomatis; bila membuka setelah tenggat → dialog wajib **Kumpulkan** (tidak bisa ditutup) |
| Durasi per soal | `duration_seconds` bertambah tiap detik untuk soal yang terbuka (seperti `useQuestionTimer`) |
| Ragu-ragu | Tombol di footer; nomor ditandai kuning |
| Deteksi kecurangan | Port `useCheatDetection`: pindah tab / keluar fullscreen (grace 1,5 dtk); ke-1 peringatan, ke-2 jawaban dikosongkan, ke-3 dikumpulkan otomatis; tablet +1 toleransi & auto re-enter; log di sessionStorage; dilaporkan ke `POST /violations` |
| Tombol kembali di soal 1 | Dijebak → dialog "Kumpulkan & keluar" |
| Lainnya | Blok salin/klik kanan & seleksi teks, ukuran huruf A−/A+, stimulus di panel kiri, konfirmasi ringkasan sebelum kumpul |
| Refresh token | Jadwal refresh proaktif ~60 detik sebelum `exp` dipasang di **root** (aktif juga di halaman ujian, fix Issue #2/#3) + refresh reaktif di interceptor |

## 5. Kustomisasi logo & tema

- Disimpan per mitra di backend (`GET/PUT /tenant/branding`), berlaku untuk semua user mitra.
- Logo tampil di sidebar admin & guru, navbar siswa, header ujian, dan halaman login.
- Warna diterapkan sebagai CSS variable (`--primary`, `--secondary`, `--brand-accent`, `--page`,
  `--success`, `--warning`, `--destructive`, `--radius`, gaya sidebar). Warna teks di atasnya dihitung
  otomatis agar kontras.
- `GET /tenant/branding` bersifat publik agar halaman login sudah bermerek sebelum login; untuk
  multi-tenant per domain backend dapat menentukan mitra dari host.
