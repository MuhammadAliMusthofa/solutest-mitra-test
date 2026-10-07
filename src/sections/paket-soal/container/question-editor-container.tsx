'use client';

import type { QuestionType } from 'src/models/question';
import type { QuestionForm } from '../helpers/question-form';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';

import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Switch } from 'src/components/ui/switch';
import { Skeleton } from 'src/components/ui/skeleton';

import { usePanel } from 'src/hooks/use-panel';

import { cn } from 'src/lib/utils';

import { paketService } from 'src/services/paket';
import { QUESTION_TYPES } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';
import { ErrorState } from 'src/components/feedback/error-state';
import { ImageUploader } from 'src/components/form/image-uploader';
import { PageHeader } from 'src/components/data-display/page-header';
import { RichTextEditor } from 'src/components/form/rich-text-editor';
import { SectionCard } from 'src/components/data-display/section-card';

import { AnswerEditor } from '../components/answer-editor';
import { useMasterData, usePackageDetail, usePaketMutations } from '../hooks/use-paket';
import { emptyForm, formToBody, validateForm, questionToForm } from '../helpers/question-form';

const TYPE_ICONS: Record<QuestionType, string> = {
  1: 'solar:list-check-linear',
  2: 'solar:checklist-minimalistic-linear',
  3: 'solar:check-square-linear',
  4: 'solar:checklist-linear',
};

/** Buat / ubah satu soal dalam paket. `questionId` kosong = soal baru. */
export function QuestionEditorContainer() {
  const router = useRouter();
  const { paths } = usePanel();
  const { id: paketId, questionId } = useParams<{ id: string; questionId?: string }>();
  const editing = Boolean(questionId && questionId !== 'baru');
  const paket = usePackageDetail(paketId);
  const existing = useQuery({
    queryKey: ['paket', 'question', paketId, questionId],
    queryFn: () => paketService.question(paketId, questionId!),
    enabled: editing,
  });
  const { saveQuestion } = usePaketMutations();
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [error, setError] = useState('');
  // kompetensi mengikuti kelas & mapel paket → sub kompetensi → indikator (berjenjang)
  const master = useMasterData({
    class_id: paket.data?.class_id,
    subject_id: paket.data?.subject_id,
    competency_id: Number(form.competencyId) || undefined,
    sub_competency_id: Number(form.subCompetencyId) || undefined,
  });
  const update = (patch: Partial<QuestionForm>) => setForm((f) => ({ ...f, ...patch }));

  // isi form saat data soal (mode ubah) selesai dimuat
  const [loaded, setLoaded] = useState(existing.data);
  if (existing.data && existing.data !== loaded) {
    setLoaded(existing.data);
    setForm(questionToForm(existing.data));
  }

  const back = paths.paketDetail(paketId);

  const submit = (addAnother: boolean) => {
    const message = validateForm(form);
    setError(message);
    if (message) return;
    saveQuestion.mutate(
      { paketId, questionId: editing ? questionId : undefined, body: formToBody(form) },
      {
        onSuccess: () => {
          if (addAnother) {
            setForm({
              ...emptyForm(),
              type: form.type,
              categoryId: form.categoryId,
              competencyId: form.competencyId,
              subCompetencyId: form.subCompetencyId,
              indicatorId: form.indicatorId,
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else router.push(back);
        },
      }
    );
  };

  if (editing && existing.isPending) return <Skeleton className="h-[70vh] w-full rounded-card" />;
  if (editing && existing.isError)
    return (
      <SectionCard>
        <ErrorState error={existing.error} onRetry={() => existing.refetch()} />
      </SectionCard>
    );

  return (
    <>
      <PageHeader
        title={editing ? 'Ubah soal' : 'Tambah soal'}
        backHref={back}
        crumbs={[
          { label: 'Paket Soal', href: paths.paketSoal },
          { label: paket.data?.title ?? 'Paket', href: back },
          { label: editing ? 'Ubah soal' : 'Soal baru' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Tipe soal">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={form.type === t.id}
                  disabled={editing}
                  onClick={() => update({ type: t.id })}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium ring-1 ring-border transition-colors hover:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60',
                    form.type === t.id && 'bg-primary/8 text-primary ring-2 ring-primary'
                  )}
                >
                  <Iconify icon={TYPE_ICONS[t.id]} size={20} />
                  {t.name}
                </button>
              ))}
            </div>
            {editing && (
              <p className="mt-2 text-xs text-muted-foreground">
                Tipe soal tidak bisa diubah setelah dibuat.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Soal">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <Label htmlFor="use-stimulus">Gunakan stimulus / bacaan</Label>
                  <p className="text-xs text-muted-foreground">
                    Ditampilkan di panel kiri saat siswa mengerjakan.
                  </p>
                </div>
                <Switch
                  id="use-stimulus"
                  checked={form.useStimulus}
                  onCheckedChange={(v) => update({ useStimulus: v })}
                />
              </div>
              {form.useStimulus && (
                <div className="space-y-2">
                  <Label>Teks stimulus</Label>
                  <RichTextEditor
                    value={form.stimulus}
                    onChange={(stimulus) => update({ stimulus })}
                    placeholder="Tulis bacaan / data pendukung…"
                    minHeight={140}
                    aria-label="Teks stimulus"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Pertanyaan</Label>
                <RichTextEditor
                  value={form.questionText}
                  onChange={(questionText) => update({ questionText })}
                  placeholder="Tulis pertanyaan…"
                  aria-label="Pertanyaan"
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar soal (opsional)</Label>
                <p className="text-xs text-muted-foreground">
                  Ditampilkan di bawah pertanyaan, mis. grafik, tabel, atau ilustrasi.
                </p>
                <ImageUploader
                  value={form.image}
                  onChange={(image) => update({ image })}
                  shape="wide"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Kunci jawaban">
            <AnswerEditor form={form} update={update} />
          </SectionCard>

          <SectionCard title="Pembahasan">
            <RichTextEditor
              value={form.explanation}
              onChange={(explanation) => update({ explanation })}
              placeholder="Jelaskan langkah penyelesaian (tampil di halaman pembahasan siswa)…"
              aria-label="Pembahasan"
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Pengaturan" className="xl:sticky xl:top-28">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="q-category">Kategori</Label>
                <SelectField
                  id="q-category"
                  value={form.categoryId}
                  onChange={(categoryId) => update({ categoryId })}
                  options={(master.categories.data ?? []).map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  }))}
                  className="sm:w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-competency">Kompetensi</Label>
                <SelectField
                  id="q-competency"
                  value={form.competencyId}
                  // ganti kompetensi → sub kompetensi & indikator lama tidak berlaku lagi
                  onChange={(competencyId) =>
                    update({ competencyId, subCompetencyId: '', indicatorId: '' })
                  }
                  options={(master.competencies.data ?? []).map((c) => ({
                    value: String(c.id),
                    label: `${c.code} · ${c.name}`,
                  }))}
                  allLabel="Tanpa kompetensi"
                  disabled={!paket.data}
                  className="sm:w-full"
                />
                {paket.data && (
                  <p className="text-xs text-muted-foreground">
                    Kelas {paket.data.class_name} · {paket.data.subject_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-sub-competency">Sub kompetensi</Label>
                <SelectField
                  id="q-sub-competency"
                  value={form.subCompetencyId}
                  onChange={(subCompetencyId) => update({ subCompetencyId, indicatorId: '' })}
                  options={(master.subCompetencies.data ?? []).map((s) => ({
                    value: String(s.id),
                    label: `${s.code} · ${s.name}`,
                  }))}
                  allLabel="Tanpa sub kompetensi"
                  disabled={!form.competencyId}
                  className="sm:w-full"
                />
                {!form.competencyId && (
                  <p className="text-xs text-muted-foreground">
                    Pilih kompetensi dulu untuk menampilkan sub kompetensinya.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-indicator">Indikator</Label>
                <SelectField
                  id="q-indicator"
                  value={form.indicatorId}
                  onChange={(indicatorId) => update({ indicatorId })}
                  options={(master.indicators.data ?? []).map((ind) => ({
                    value: String(ind.id),
                    label: `${ind.code} · ${ind.name}`,
                  }))}
                  allLabel="Tanpa indikator"
                  disabled={!form.subCompetencyId}
                  className="sm:w-full"
                />
                {!form.subCompetencyId && (
                  <p className="text-xs text-muted-foreground">
                    Pilih sub kompetensi dulu untuk menampilkan indikatornya.
                  </p>
                )}
              </div>
              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive"
                >
                  <Iconify icon="solar:danger-circle-linear" size={18} className="mt-0.5" />
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={() => submit(false)} disabled={saveQuestion.isPending}>
                  {saveQuestion.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
                  Simpan soal
                </Button>
                {!editing && (
                  <Button
                    variant="outline"
                    onClick={() => submit(true)}
                    disabled={saveQuestion.isPending}
                  >
                    Simpan & tambah lagi
                  </Button>
                )}
                <Button variant="ghost" onClick={() => router.push(back)}>
                  Batal
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
