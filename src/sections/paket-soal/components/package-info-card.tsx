'use client';

import type { PackageDetail } from 'src/models/question';

import { toast } from 'sonner';

import { Button } from 'src/components/ui/button';

import { cn } from 'src/lib/utils';
import { formatShortDate } from 'src/utils/format';

import { questionTypeName } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';
import { StatTile, ToneIcon, toneStyle } from 'src/components/data-display/kpi-card';

import { subjectIcon, subjectTone } from '../helpers/subject-style';

/** Warna segmen komposisi tipe soal (palet chart tervalidasi). */
const TYPE_COLORS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

const countBy = (items: string[]) =>
  Object.entries(
    items.reduce<Record<string, number>>((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

/** Ringkasan paket: header bertone mapel, kode, statistik, aturan, komposisi tipe & kompetensi. */
export function PackageInfoCard({ p }: { p: PackageDetail }) {
  const tone = subjectTone(p.subject_id ?? p.id);
  const total = p.questions.length;
  const types = countBy(p.questions.map((q) => questionTypeName(q.type_question_id)));
  const competencies = countBy(p.questions.map((q) => q.competency_name ?? 'Tanpa kompetensi'));
  const maxCompetency = Math.max(1, ...competencies.map(([, n]) => n));

  const rules = [
    {
      icon: p.show_score ? 'solar:eye-linear' : 'solar:eye-closed-linear',
      label: 'Nilai ke siswa',
      value: p.show_score ? 'Ditampilkan' : 'Disembunyikan',
      on: p.show_score,
    },
    {
      icon: 'solar:shield-check-linear',
      label: 'Deteksi kecurangan',
      value: p.is_cheat_detection ? `Aktif · maks. ${p.max_violations}×` : 'Nonaktif',
      on: p.is_cheat_detection,
    },
    {
      icon: p.source === 'SOLUTEST' ? 'solar:import-linear' : 'solar:user-hand-up-linear',
      label: 'Sumber',
      value: p.source === 'SOLUTEST' ? 'Salinan Solutest' : 'Buatan mitra',
      on: true,
    },
  ];

  return (
    <section
      style={toneStyle(tone)}
      className="h-fit overflow-hidden rounded-card bg-card shadow-card xl:sticky xl:top-28"
    >
      <div className="deco-rings bg-[color-mix(in_srgb,var(--tone)_10%,var(--card))] p-5 md:p-6">
        <div className="flex items-center gap-3">
          <ToneIcon icon={subjectIcon(p.subject_name)} tone={tone} solid size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-(--tone-ink)">
              {p.subject_name ?? 'Mapel belum diatur'}
            </p>
            <p className="text-sm text-foreground/65">
              {p.class_name ? `Kelas ${p.class_name}` : 'Kelas belum diatur'}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl bg-card/90 py-2 pr-2 pl-4 shadow-card">
          <div>
            <p className="text-[0.7rem] font-semibold text-muted-foreground">Kode paket</p>
            <p className="font-mono text-lg leading-tight font-bold">{p.code}</p>
          </div>
          <Button
            variant="soft"
            size="icon-sm"
            aria-label="Salin kode paket"
            onClick={() =>
              navigator.clipboard.writeText(p.code).then(() => toast.success('Kode paket disalin'))
            }
          >
            <Iconify icon="solar:copy-linear" size={18} />
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Jumlah soal" value={String(total)} />
          <StatTile label="Durasi" value={`${p.time} mnt`} tone="info" />
          <StatTile label="Dipakai jadwal" value={`${p.schedule_count}×`} tone="success" />
          <StatTile label="Diperbarui" value={formatShortDate(p.updatedAt)} tone="secondary" />
        </div>

        <ul className="divide-y divide-border rounded-2xl ring-1 ring-border">
          {rules.map((r) => (
            <li key={r.label} className="flex items-center gap-3 px-4 py-3 text-sm">
              <Iconify
                icon={r.icon}
                size={18}
                className={cn(r.on ? 'text-primary' : 'text-muted-foreground')}
              />
              <span className="text-muted-foreground">{r.label}</span>
              <span className="ml-auto text-right font-semibold">{r.value}</span>
            </li>
          ))}
        </ul>

        {total > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold">Komposisi tipe soal</h3>
            <div
              className="flex h-3 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={types.map(([name, n]) => `${name} ${n}`).join(', ')}
            >
              {types.map(([name, n], i) => (
                <span
                  key={name}
                  className={cn('h-full', TYPE_COLORS[i % TYPE_COLORS.length])}
                  style={{ width: `${(n / total) * 100}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {types.map(([name, n], i) => (
                <li key={name} className="flex items-center gap-2">
                  <span
                    className={cn('size-2.5 rounded-full', TYPE_COLORS[i % TYPE_COLORS.length])}
                  />
                  <span className="text-foreground/80">{name}</span>
                  <span className="ml-auto font-bold tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {competencies.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold">Sebaran kompetensi</h3>
            <ul className="space-y-3 text-sm">
              {competencies.map(([name, n]) => (
                <li key={name}>
                  <div className="flex justify-between gap-3">
                    <span className="line-clamp-2 text-foreground/80">{name}</span>
                    <span className="font-bold tabular-nums">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(n / maxCompetency) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
