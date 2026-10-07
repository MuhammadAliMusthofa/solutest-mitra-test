'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Skeleton } from 'src/components/ui/skeleton';

import { SISWA_PATHS } from 'src/config/paths';

import { errorMessage } from 'src/core/http';

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
  const qc = useQueryClient();
  const detail = useTryoutDetail(code);
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.me });
  const { start, resume, loading } = useExamFlow();
  const [agree, setAgree] = useState(false);
  const [bio, setBio] = useState({ full_name: '', nisn: '', school_name: '', class_name: '' });
  const d = detail.data;

  const [loadedProfile, setLoadedProfile] = useState(profile.data);
  if (profile.data && profile.data !== loadedProfile) {
    setLoadedProfile(profile.data);
    setBio({
      full_name: profile.data.full_name,
      nisn: profile.data.nisn ?? '',
      school_name: profile.data.school_name ?? '',
      class_name: profile.data.class_name ?? '',
    });
  }

  const saveBio = useMutation({
    mutationFn: () =>
      profileService.update({
        full_name: bio.full_name.trim(),
        nisn: bio.nisn.trim() || null,
        school_name: bio.school_name.trim() || null,
        class_name: bio.class_name.trim() || null,
      }),
    onSuccess: (data) => qc.setQueryData(['profile', 'me'], data),
  });

  const bioValid =
    bio.full_name.trim() && bio.school_name.trim() && (!bio.nisn || /^\d{10}$/.test(bio.nisn));
  const bioDirty =
    profile.data &&
    (bio.full_name !== profile.data.full_name ||
      bio.nisn !== (profile.data.nisn ?? '') ||
      bio.school_name !== (profile.data.school_name ?? '') ||
      bio.class_name !== (profile.data.class_name ?? ''));

  const onStart = async () => {
    if (!d) return;
    // fullscreen harus diminta langsung dari gesture klik (sebelum await)
    enterFullscreen();
    if (bioDirty) {
      try {
        await saveBio.mutateAsync();
      } catch (err) {
        toast.error(errorMessage(err));
        return;
      }
    }
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
                  ['solar:book-2-linear', 'Mapel', `${d.subject_name} · Kelas ${d.class_name}`],
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
                  Kamu sudah mengumpulkan tryout ini. Lihat hasilnya di riwayat.
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
                    <div className="space-y-1.5">
                      <Label htmlFor="b-name">Nama lengkap</Label>
                      <Input
                        id="b-name"
                        value={bio.full_name}
                        onChange={(e) => setBio((b) => ({ ...b, full_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="b-nisn">NISN (opsional)</Label>
                      <Input
                        id="b-nisn"
                        inputMode="numeric"
                        value={bio.nisn}
                        onChange={(e) =>
                          setBio((b) => ({
                            ...b,
                            nisn: e.target.value.replace(/\D/g, '').slice(0, 10),
                          }))
                        }
                        aria-invalid={Boolean(bio.nisn) && !/^\d{10}$/.test(bio.nisn)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="b-school">Sekolah</Label>
                      <Input
                        id="b-school"
                        value={bio.school_name}
                        onChange={(e) => setBio((b) => ({ ...b, school_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="b-class">Kelas</Label>
                      <Input
                        id="b-class"
                        value={bio.class_name}
                        onChange={(e) => setBio((b) => ({ ...b, class_name: e.target.value }))}
                      />
                    </div>
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
                        d.status !== 'ongoing' ||
                        !agree ||
                        !bioValid ||
                        loading !== null ||
                        saveBio.isPending
                      }
                      onClick={onStart}
                    >
                      {loading !== null || saveBio.isPending ? (
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
