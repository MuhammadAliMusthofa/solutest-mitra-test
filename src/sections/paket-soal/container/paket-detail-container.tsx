'use client';

import type { Question } from 'src/models/question';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Skeleton } from 'src/components/ui/skeleton';

import { usePanel } from 'src/hooks/use-panel';

import { cn } from 'src/lib/utils';
import { formatShortDate } from 'src/utils/format';

import { questionTypeName } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { PageHeader } from 'src/components/data-display/page-header';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { SectionCard } from 'src/components/data-display/section-card';

import { QuestionCard } from '../components/question-card';
import { PackageFormDialog } from '../components/package-form-dialog';
import { usePackageDetail, usePaketMutations } from '../hooks/use-paket';

export function PaketDetailContainer() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { paths } = usePanel();
  const query = usePackageDetail(id);
  const { removeQuestion, removeQuestions, duplicatePackage } = usePaketMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ q: Question; no: number } | null>(null);
  const [picked, setPicked] = useState<Set<number>>(() => new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const p = query.data;
  const locked = p ? !p.is_editable : false;

  // hanya soal yang masih ada di paket yang dihitung terpilih
  const questionIds = (p?.questions ?? []).map((q) => q.id);
  const selected = questionIds.filter((qid) => picked.has(qid));
  const allSelected = questionIds.length > 0 && selected.length === questionIds.length;

  const toggle = (qid: number, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(qid);
      else next.delete(qid);
      return next;
    });

  const duplicate = () =>
    p &&
    duplicatePackage.mutate(p.id, { onSuccess: (pkg) => router.push(paths.paketDetail(pkg.id)) });

  const typeCounts = Object.entries(
    (p?.questions ?? []).reduce<Record<string, number>>((acc, q) => {
      const name = questionTypeName(q.type_question_id);
      return { ...acc, [name]: (acc[name] ?? 0) + 1 };
    }, {})
  );
  const competencyCounts = Object.entries(
    (p?.questions ?? []).reduce<Record<string, number>>((acc, q) => {
      const name = q.competency_name ?? 'Tanpa kompetensi';
      return { ...acc, [name]: (acc[name] ?? 0) + 1 };
    }, {})
  );

  return (
    <>
      <PageHeader
        title={p?.title ?? 'Detail paket'}
        backHref={paths.paketSoal}
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Paket Soal', href: paths.paketSoal },
          { label: p?.code ?? 'Detail' },
        ]}
        actions={
          p && (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Iconify icon="solar:pen-linear" size={18} />
                Ubah info
              </Button>
              <Button variant="outline" onClick={duplicate} disabled={duplicatePackage.isPending}>
                <Iconify
                  icon={duplicatePackage.isPending ? 'svg-spinners:180-ring' : 'solar:copy-linear'}
                  size={18}
                />
                Salin paket
              </Button>
              {!locked && (
                <Button asChild>
                  <Link href={paths.questionCreate(p.id)}>
                    <Iconify icon="solar:add-circle-linear" size={18} />
                    Tambah soal
                  </Link>
                </Button>
              )}
            </>
          )
        }
      />

      {locked && (
        <p
          role="status"
          className="mb-6 flex items-start gap-2 rounded-card bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          <Iconify icon="solar:lock-keyhole-linear" size={18} className="mt-0.5 shrink-0" />
          Paket ini sudah dikerjakan siswa sehingga soal terkunci agar nilai tetap konsisten. Klik
          &quot;Salin paket&quot; untuk membuat versi baru yang bisa diedit.
        </p>
      )}

      {query.isPending && <Skeleton className="h-80 w-full rounded-card" />}
      {query.isError && (
        <SectionCard>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </SectionCard>
      )}
      {p && (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <SectionCard title="Info paket" className="h-fit xl:sticky xl:top-28">
            <div className="flex items-center justify-between rounded-xl bg-primary/6 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Kode paket</p>
                <p className="font-mono text-lg font-semibold">{p.code}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Salin kode paket"
                onClick={() =>
                  navigator.clipboard
                    .writeText(p.code)
                    .then(() => toast.success('Kode paket disalin'))
                }
              >
                <Iconify icon="solar:copy-linear" size={18} />
              </Button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ['Mapel', p.subject_name ?? '—'],
                ['Kelas', p.class_name ?? '—'],
                ['Sumber', p.source === 'SOLUTEST' ? 'Salinan paket Solutest' : 'Buatan mitra'],
                ['Jumlah soal', String(p.question_count)],
                ['Durasi bawaan', `${p.time} menit`],
                ['Tampilkan nilai', p.show_score ? 'Ya' : 'Tidak'],
                [
                  'Deteksi kecurangan',
                  p.is_cheat_detection ? `Aktif (maks. ${p.max_violations} pelanggaran)` : 'Tidak',
                ],
                ['Dipakai jadwal', `${p.schedule_count}×`],
                ['Diperbarui', formatShortDate(p.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {competencyCounts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  Sebaran kompetensi
                </p>
                <ul className="space-y-1 text-sm">
                  {competencyCounts.map(([name, n]) => (
                    <li key={name} className="flex justify-between gap-3">
                      <span className="line-clamp-2">{name}</span>
                      <span className="font-semibold tabular-nums">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {typeCounts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  Komposisi tipe
                </p>
                <ul className="space-y-1 text-sm">
                  {typeCounts.map(([name, n]) => (
                    <li key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="font-semibold tabular-nums">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>

          <SectionCard title={`Daftar soal (${p.questions.length})`}>
            {p.questions.length === 0 ? (
              <EmptyState
                title="Paket masih kosong"
                description="Tambahkan soal pertama: PG, PG Kompleks, Benar/Salah, atau Benar/Salah Kompleks."
                icon="solar:document-add-linear"
                action={
                  <Button asChild disabled={locked}>
                    <Link href={paths.questionCreate(p.id)}>
                      <Iconify icon="solar:add-circle-linear" size={18} />
                      Tambah soal
                    </Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div
                  className={cn(
                    'sticky top-24 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-card px-4 py-2.5 ring-1 ring-border',
                    locked && 'hidden'
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) => setPicked(v ? new Set(questionIds) : new Set())}
                      aria-label="Pilih semua soal"
                    />
                    {selected.length ? `${selected.length} soal dipilih` : 'Pilih semua'}
                  </label>
                  {selected.length > 0 && (
                    <div className="ml-auto flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())}>
                        Batal pilih
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setConfirmBulk(true)}>
                        <Iconify icon="solar:trash-bin-trash-linear" size={16} />
                        Hapus {selected.length} soal
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {p.questions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      no={i + 1}
                      editHref={paths.questionEdit(p.id, q.id)}
                      onDelete={() => setToDelete({ q, no: i + 1 })}
                      selected={picked.has(q.id)}
                      onSelectedChange={(on) => toggle(q.id, on)}
                      locked={locked}
                    />
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      )}

      {p && <PackageFormDialog open={editOpen} onOpenChange={setEditOpen} initial={p} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        tone="danger"
        title={`Hapus soal nomor ${toDelete?.no}?`}
        description="Soal dihapus dari paket ini. Tryout yang sudah dikerjakan tidak terpengaruh."
        confirmLabel="Hapus"
        loading={removeQuestion.isPending}
        onConfirm={() =>
          toDelete &&
          removeQuestion.mutate(
            { paketId: id, questionId: toDelete.q.id },
            { onSuccess: () => setToDelete(null) }
          )
        }
      />
      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        tone="danger"
        title={`Hapus ${selected.length} soal terpilih?`}
        description="Soal terpilih dihapus dari paket ini. Tryout yang sudah dikerjakan tidak terpengaruh."
        confirmLabel={`Hapus ${selected.length} soal`}
        loading={removeQuestions.isPending}
        onConfirm={() =>
          removeQuestions.mutate(
            { paketId: id, ids: selected },
            {
              onSuccess: () => {
                setConfirmBulk(false);
                setPicked(new Set());
              },
            }
          )
        }
      />
    </>
  );
}
