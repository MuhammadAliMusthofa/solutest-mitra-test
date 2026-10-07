// Form & status jadwal tryout (port dari helpers/schedule.ts prototipe mitra).

import type {
  StudentTryout,
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
  is_cheat_detection: boolean;
}

export type ScheduleFormErrors = Record<'title' | 'package_id' | 'end' | 'duration', string>;

const toInput = (d: dayjs.Dayjs) => d.format('YYYY-MM-DDTHH:mm');

/** Default: besok 08.00–17.00, 120 menit, deteksi kecurangan aktif. */
export const createScheduleForm = (): ScheduleForm => ({
  title: '',
  package_id: '',
  start: toInput(dayjs().add(1, 'day').hour(8).minute(0)),
  end: toInput(dayjs().add(1, 'day').hour(17).minute(0)),
  duration: '120',
  description: '',
  is_cheat_detection: true,
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
    duration: !(Number(form.duration) > 0) ? 'Durasi harus lebih dari 0' : '',
  };
};

export const hasErrors = (errors: ScheduleFormErrors) => Object.values(errors).some(Boolean);

export const toSchedulePayload = (form: ScheduleForm): CreateTryoutScheduleBody => ({
  title: form.title.trim(),
  package_id: Number(form.package_id),
  start_date: dayjs(form.start).format('YYYY-MM-DD HH:mm:ss'),
  end_date: dayjs(form.end).format('YYYY-MM-DD HH:mm:ss'),
  duration: Number(form.duration),
  description: form.description,
  is_cheat_detection: form.is_cheat_detection,
});

/** Kelompokkan tryout siswa (aktif / selesai) dan hitung statistik skor. */
export const summarizeStudentTryouts = (tryouts: StudentTryout[]) => {
  const scores = tryouts
    .filter((t) => t.is_done && t.score !== null && t.score !== undefined)
    .map((t) => t.score as number);
  return {
    active: tryouts.filter((t) => t.status !== 'finished' && !t.is_done),
    done: tryouts.filter((t) => t.is_done),
    completedCount: scores.length,
    averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    bestScore: scores.length ? Math.max(...scores) : null,
  };
};
