'use client';

import type { Question } from 'src/models/question';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams } from 'next/navigation';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';

import { usePanel } from 'src/hooks/use-panel';

import { formatShortDate } from 'src/utils/format';

import { questionTypeName } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { SectionCard } from 'src/components/data-display/section-card';

import { QuestionCard } from '../components/question-card';
import { GenerateDialog } from '../components/generate-dialog';
import { PackageFormDialog } from '../components/package-form-dialog';
import { usePackageDetail, usePaketMutations } from '../hooks/use-paket';

export function PaketDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const { paths } = usePanel();
  const query = usePackageDetail(id);
  const { removeQuestion } = usePaketMutations();
  const [genOpen, setGenOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ q: Question; no: number } | null>(null);
  const p = query.data;

  const typeCounts = Object.entries(
    (p?.questions ?? []).reduce<Record<string, number>>((acc, q) => {
      const name = questionTypeName(q.type_question_id);
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
              <Button variant="outline" onClick={() => setGenOpen(true)}>
                <Iconify icon="solar:magic-stick-3-linear" size={18} />
                Generate dari bank soal
              </Button>
              <Button asChild>
                <Link href={paths.questionCreate(p.id)}>
                  <Iconify icon="solar:add-circle-linear" size={18} />
                  Tambah soal
                </Link>
              </Button>
            </>
          )
        }
      />

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
                ['Mapel', p.subject_name],
                ['Kelas', p.class_name],
                ['Jumlah soal', String(p.question_count)],
                ['Dipakai jadwal', `${p.schedule_count}×`],
                ['Diperbarui', formatShortDate(p.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {p.chapters.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Bab</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.chapters.map((c) => (
                    <StatusPill key={c.id}>{c.name}</StatusPill>
                  ))}
                </div>
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
                description="Tambahkan soal manual atau generate dari bank soal."
                icon="solar:document-add-linear"
                action={
                  <Button onClick={() => setGenOpen(true)}>
                    <Iconify icon="solar:magic-stick-3-linear" size={18} />
                    Generate dari bank soal
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {p.questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    no={i + 1}
                    editHref={paths.questionEdit(p.id, q.id)}
                    onDelete={() => setToDelete({ q, no: i + 1 })}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {p && <GenerateDialog open={genOpen} onOpenChange={setGenOpen} paket={p} />}
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
    </>
  );
}
