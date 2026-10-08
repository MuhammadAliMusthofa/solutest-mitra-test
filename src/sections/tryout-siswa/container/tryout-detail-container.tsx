'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Skeleton } from 'src/components/ui/skeleton';

import { SISWA_PATHS } from 'src/config/paths';

import { formatDateTime } from 'src/utils/format';

import { profileService } from 'src/services/account';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { HtmlContent } from 'src/components/data-display/html-content';
import { SectionCard } from 'src/components/data-display/section-card';

import { SCHEDULE_STATUS } from 'src/sections/jadwal-tryout/helpers/schedule';
import { useExamFlow, enterFullscreen } from 'src/sections/ujian/hooks/use-exam-flow';

import { useTryoutDetail } from '../hooks/use-student-data';

const RULES = (cheat: boolean, max: number) => [
  'Pastikan koneksi internet stabil. Jawaban tersimpan otomatis setiap berpindah soal.',
  'Waktu berjalan sejak tombol "Mulai" ditekan dan tidak berhenti walau halaman ditutup.',
  'Jika keluar di tengah jalan, lanjutkan lewat kartu "Tryout belum selesai" di beranda.',
  'Waktu habis atau browser ditutup tanpa mengumpulkan → jawaban tersimpan dikumpulkan otomatis.',
  'Gunakan tombol "Ragu-ragu" untuk menandai soal yang ingin diperiksa lagi.',
  ...(cheat
    ? [
        'Tryout berjalan dalam mode layar penuh. Keluar layar penuh atau pindah tab/aplikasi dihitung pelanggaran.',
        `Pelanggaran ke-2 mengosongkan semua jawaban; pelanggaran ke-${max} mengumpulkan tryout otomatis.`,
      ]
    : []),
  'Jawaban dikirim saat menekan "Kumpulkan" atau otomatis saat waktu habis.',
];

export function TryoutDetailContainer() {
  const { code: raw } = useParams<{ code: string }>();
  const code = decodeURIComponent(raw);
  const detail = useTryoutDetail(code);
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.me });
  const { start, resume, loading } = useExamFlow();
  const [agree, setAgree] = useState(false);
  const d = detail.data;
  const p = profile.data;

  const onStart = () => {
    if (!d) return;
    // fullscreen harus diminta langsung dari gesture klik (sebelum await)
    enterFullscreen();
    start(d.code);
  };

  return (
    <>
      <PageHeader
        title={d?.title ?? 'Detail tryout'}
        backHref={SISWA_PATHS.tryout}
        crumbs={[
          { label: 'Beranda', href: SISWA_PATHS.root },
          { label: 'Tryout', href: SISWA_PATHS.tryout },
          { label: code },
        ]}
      />
      {detail.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {detail.isError && (
        <SectionCard>
          <ErrorState
            title="Tryout tidak ditemukan"
            error={detail.error}
            onRetry={() => detail.refetch()}
          />
        </SectionCard>
      )}
      {d && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <SectionCard>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  tone={SCHEDULE_STATUS[d.status].tone}
                  icon={SCHEDULE_STATUS[d.status].icon}
                >
                  {SCHEDULE_STATUS[d.status].label}
                </StatusPill>
                {d.is_cheat_detection && (
                  <StatusPill tone="warning" icon="solar:shield-check-linear">
                    Deteksi kecurangan aktif
                  </StatusPill>
                )}
              </div>
              <HtmlContent html={d.description} className="mt-4" />
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['solar:hashtag-linear', 'Kode', d.code],
                  [
                    'solar:book-2-linear',
                    'Mapel',
                    [d.subject_name, d.class_name && `Kelas ${d.class_name}`]
                      .filter(Boolean)
                      .join(' · ') || '-',
                  ],
                  [
                    'solar:restart-linear',
                    'Kesempatan',
                    `${d.attempts_used}/${d.max_attempts} kali dipakai`,
                  ],
                  ['solar:document-text-linear', 'Jumlah soal', `${d.total_question} soal`],
                  ['solar:clock-circle-linear', 'Durasi', `${d.duration} menit`],
                  ['solar:calendar-linear', 'Dibuka', formatDateTime(d.start_date)],
                  ['solar:calendar-mark-linear', 'Ditutup', formatDateTime(d.end_date)],
                ].map(([icon, k, v]) => (
                  <div key={k} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <Iconify icon={icon} size={20} className="text-primary" />
                    <div>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="text-sm font-semibold">{v}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </SectionCard>
            <SectionCard title="Aturan pengerjaan">
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {RULES(d.is_cheat_detection, d.max_violations).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
            </SectionCard>
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            {d.is_done ? (
              <SectionCard title="Sudah dikerjakan">
                <p className="text-sm text-muted-foreground">
                  Kesempatan mengerjakan tryout ini sudah habis. Lihat hasilnya di riwayat.
                </p>
                <Button className="mt-4 w-full" asChild>
                  <Link href={SISWA_PATHS.history}>Buka riwayat</Link>
                </Button>
              </SectionCard>
            ) : d.unfinished_practice_id ? (
              <SectionCard title="Lanjutkan pengerjaan">
                <p className="text-sm text-muted-foreground">
                  Kamu sudah memulai tryout ini. Jawaban yang tersimpan akan dimuat kembali.
                </p>
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  disabled={loading !== null}
                  onClick={() => resume(d.unfinished_practice_id!)}
                >
                  {loading !== null ? (
                    <Iconify icon="svg-spinners:180-ring" size={18} />
                  ) : (
                    <Iconify icon="solar:play-linear" size={18} />
                  )}
                  Lanjutkan
                </Button>
              </SectionCard>
            ) : (
              <SectionCard
                title="Konfirmasi data diri"
                description="Data ini tampil di leaderboard & laporan hasil."
              >
                {profile.isPending ? (
                  <Skeleton className="h-56 w-full rounded-xl" />
                ) : (
                  <div className="space-y-3">
                    <dl className="space-y-2 text-sm">
                      {[
                        ['Nama', p?.full_name],
                        ['NISN', p?.nisn],
                        ['Sekolah', p?.school_name],
                        ['Kelas', p?.class_name],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                        >
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="text-right font-medium">{v || '-'}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-muted-foreground">
                      Data salah? Hubungi guru atau admin sekolahmu.
                    </p>
                    <label className="flex items-start gap-2 pt-2 text-sm">
                      <Checkbox
                        checked={agree}
                        onCheckedChange={(v) => setAgree(Boolean(v))}
                        className="mt-0.5"
                      />
                      Saya sudah membaca aturan dan siap mengerjakan dengan jujur.
                    </label>
                    {d.status !== 'ongoing' && (
                      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {d.status === 'scheduled'
                          ? `Tryout dibuka ${formatDateTime(d.start_date)}.`
                          : 'Tryout sudah ditutup.'}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      size="lg"
                      disabled={
                        d.status !== 'ongoing' || !d.can_start || !agree || loading !== null
                      }
                      onClick={onStart}
                    >
                      {loading !== null ? (
                        <Iconify icon="svg-spinners:180-ring" size={18} />
                      ) : (
                        <Iconify icon="solar:play-linear" size={18} />
                      )}
                      Mulai tryout
                    </Button>
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </>
  );
}
