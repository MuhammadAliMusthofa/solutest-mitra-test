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
  description?: string;
  is_cheat_detection: boolean;
  participants: number;
  status: TryoutScheduleStatus;
  created_by?: string;
}

export interface CreateTryoutScheduleBody {
  title: string;
  package_id: number;
  start_date: string;
  end_date: string;
  duration: number;
  description?: string;
  is_cheat_detection: boolean;
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
  status: TryoutScheduleStatus;
  is_done: boolean;
  /** practice_id bila sudah mulai tapi belum dikumpulkan */
  unfinished_practice_id?: number | null;
  score?: number | null;
}
