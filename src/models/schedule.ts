// Jadwal tryout (dibuat admin/guru) dan tryout yang terlihat siswa.

export type TryoutScheduleStatus = 'scheduled' | 'ongoing' | 'finished';

export interface TryoutSchedule {
  id: number;
  code: string;
  title: string;
  package_id: number;
  package_title: string;
  package_code: string;
  start_date: string;
  end_date: string;
  /** durasi pengerjaan dalam menit */
  duration: number;
  description?: string | null;
  /** diatur di paket soal */
  is_cheat_detection: boolean;
  max_attempts: number;
  /** false = draft, belum tampil ke siswa */
  is_published: boolean;
  /** true = semua sekolah mitra; false = hanya `schools` */
  is_all_schools: boolean;
  schools: { id: number; name: string }[];
  /** siswa unik yang sudah mulai mengerjakan */
  participants: number;
  total_submitted: number;
  total_in_progress: number;
  status: TryoutScheduleStatus;
}

export interface CreateTryoutScheduleBody {
  title: string;
  package_id: number;
  /** ISO 8601 */
  start_at: string;
  end_at: string;
  duration: number;
  description?: string | null;
  max_attempts?: number;
  is_published?: boolean;
  /** [] = semua sekolah mitra */
  school_ids?: number[];
}

/** Tryout yang terlihat oleh siswa di berandanya. */
export interface StudentTryout {
  id: number;
  code: string;
  title: string;
  package_id: number;
  start_date: string;
  end_date: string;
  duration: number;
  total_questions: number;
  subject_name: string | null;
  status: TryoutScheduleStatus;
  max_attempts: number;
  attempts_used: number;
  can_start: boolean;
  /** sudah pernah mengumpulkan minimal sekali */
  is_done: boolean;
  /** practice_id bila sudah mulai tapi belum dikumpulkan */
  unfinished_practice_id?: number | null;
  /** nilai pengerjaan terakhir (null bila disembunyikan / belum dinilai) */
  score?: number | null;
}
