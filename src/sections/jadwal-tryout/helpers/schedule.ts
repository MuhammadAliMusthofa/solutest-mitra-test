// Form & status jadwal tryout (port dari helpers/schedule.ts prototipe mitra).

import type {
  StudentTryout,
  TryoutSchedule,
  TryoutScheduleStatus,
  CreateTryoutScheduleBody,
} from 'src/models/schedule';

import dayjs from 'dayjs';

import type { PillTone } from 'src/components/data-display/status-pill';

export const SCHEDULE_STATUSES: TryoutScheduleStatus[] = ['scheduled', 'ongoing', 'finished'];

export const SCHEDULE_STATUS: Record<
  TryoutScheduleStatus,
  { label: string; tone: PillTone; icon: string }
> = {
  scheduled: { label: 'Terjadwal', tone: 'primary', icon: 'solar:calendar-linear' },
  ongoing: { label: 'Berlangsung', tone: 'success', icon: 'solar:play-circle-linear' },
  finished: { label: 'Selesai', tone: 'neutral', icon: 'solar:check-circle-linear' },
};

export interface ScheduleForm {
  title: string;
  package_id: string;
  /** nilai input datetime-local (YYYY-MM-DDTHH:mm) */
  start: string;
  end: string;
  duration: string;
  description: string;
  max_attempts: string;
  is_published: boolean;
  /** kosong = semua sekolah mitra */
  school_ids: number[];
}

export type ScheduleFormErrors = Record<
  'title' | 'package_id' | 'end' | 'duration' | 'max_attempts',
  string
>;

const toInput = (d: dayjs.Dayjs) => d.format('YYYY-MM-DDTHH:mm');

/** Default: besok 08.00–17.00, 120 menit, 1 kali pengerjaan, semua sekolah, langsung terbit. */
export const createScheduleForm = (): ScheduleForm => ({
  title: '',
  package_id: '',
  start: toInput(dayjs().add(1, 'day').hour(8).minute(0)),
  end: toInput(dayjs().add(1, 'day').hour(17).minute(0)),
  duration: '120',
  description: '',
  max_attempts: '1',
  is_published: true,
  school_ids: [],
});

/** Isi form dari jadwal yang sudah ada (mode ubah). */
export const scheduleToForm = (s: TryoutSchedule): ScheduleForm => ({
  title: s.title,
  package_id: String(s.package_id),
  start: toInput(dayjs(s.start_date)),
  end: toInput(dayjs(s.end_date)),
  duration: String(s.duration),
  description: s.description ?? '',
  max_attempts: String(s.max_attempts),
  is_published: s.is_published,
  school_ids: s.is_all_schools ? [] : s.schools.map((sc) => sc.id),
});

export const validateScheduleForm = (form: ScheduleForm): ScheduleFormErrors => {
  const start = dayjs(form.start);
  const end = dayjs(form.end);
  return {
    title: !form.title.trim() ? 'Judul wajib diisi' : '',
    package_id: !form.package_id ? 'Pilih paket soal' : '',
    end:
      end.isValid() && start.isValid() && !end.isAfter(start)
        ? 'Waktu selesai harus setelah waktu mulai'
        : '',
    duration: !(Number(form.duration) >= 1 && Number(form.duration) <= 1440)
      ? 'Durasi 1–1440 menit'
      : '',
    max_attempts: !(Number(form.max_attempts) >= 1 && Number(form.max_attempts) <= 100)
      ? 'Kesempatan 1–100 kali'
      : '',
  };
};

export const hasErrors = (errors: ScheduleFormErrors) => Object.values(errors).some(Boolean);

export const toSchedulePayload = (form: ScheduleForm): CreateTryoutScheduleBody => ({
  title: form.title.trim(),
  package_id: Number(form.package_id),
  // datetime-local = jam lokal browser → ISO UTC untuk backend
  start_at: dayjs(form.start).toISOString(),
  end_at: dayjs(form.end).toISOString(),
  duration: Number(form.duration),
  description: form.description.trim() || null,
  max_attempts: Number(form.max_attempts),
  is_published: form.is_published,
  school_ids: form.school_ids,
});

/** Kelompokkan tryout siswa (aktif / selesai) dan hitung statistik skor. */
export const summarizeStudentTryouts = (tryouts: StudentTryout[]) => {
  const scores = tryouts
    .filter((t) => t.is_done && t.score !== null && t.score !== undefined)
    .map((t) => t.score as number);
  return {
    active: tryouts.filter(
      (t) =>
        t.status === 'scheduled' ||
        (t.status === 'ongoing' && (t.can_start || Boolean(t.unfinished_practice_id)))
    ),
    done: tryouts.filter((t) => t.is_done),
    completedCount: scores.length,
    averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    bestScore: scores.length ? Math.max(...scores) : null,
  };
};
