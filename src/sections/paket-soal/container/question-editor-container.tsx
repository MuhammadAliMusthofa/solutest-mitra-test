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

const TYPE_META: Record<QuestionType, { icon: string; hint: string }> = {
  1: { icon: 'solar:list-check-bold', hint: 'Satu jawaban benar' },
  2: { icon: 'solar:checklist-minimalistic-bold', hint: 'Lebih dari satu jawaban benar' },
  3: { icon: 'solar:check-square-bold', hint: 'Satu pernyataan Benar / Salah' },
  9: { icon: 'solar:checklist-bold', hint: 'Tabel beberapa pernyataan' },
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
  // kompetensi mengikuti kelas & mapel paket → sub kompetensi (berjenjang)
  const master = useMasterData({
    class_id: paket.data?.class_id ?? undefined,
    subject_id: paket.data?.subject_id ?? undefined,
    competency_id: Number(form.competencyId) || undefined,
  });
  const locked = paket.data ? !paket.data.is_editable : false;
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
              competencyId: form.competencyId,
              subCompetencyId: form.subCompetencyId,
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

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <SectionCard
            title="Tipe soal"
            description="Menentukan cara siswa menjawab."
            icon="solar:widget-4-linear"
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={form.type === t.id}
                  disabled={editing}
                  onClick={() => update({ type: t.id })}
                  className={cn(
                    'group/type relative flex flex-col items-start gap-3 rounded-2xl p-4 text-left ring-1 ring-border transition-[background-color,box-shadow] duration-150 hover:bg-primary/[0.03] hover:ring-primary/45 focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent',
                    form.type === t.id && 'bg-primary/[0.06] ring-2 ring-primary hover:ring-primary'
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 place-items-center rounded-xl transition-colors',
                      form.type === t.id
                        ? 'bg-primary text-primary-foreground shadow-btn'
                        : 'bg-muted text-foreground/60 group-hover/type:bg-primary/10 group-hover/type:text-primary'
                    )}
                  >
                    <Iconify icon={TYPE_META[t.id].icon} size={20} />
                  </span>
                  <span>
                    <span
                      className={cn(
                        'block text-sm font-bold',
                        form.type === t.id && 'text-primary'
                      )}
                    >
                      {t.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {TYPE_META[t.id].hint}
                    </span>
                  </span>
                  {form.type === t.id && (
                    <Iconify
                      icon="solar:check-circle-bold"
                      size={20}
                      className="absolute top-3 right-3 text-primary"
                    />
                  )}
                </button>
              ))}
            </div>
            {editing && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Iconify icon="solar:lock-keyhole-linear" size={14} />
                Tipe soal tidak bisa diubah setelah dibuat.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Soal"
            description="Pertanyaan, bacaan pendukung, dan gambar."
            icon="solar:document-text-linear"
            tone="info"
          >
            <div className="space-y-5">
              <div
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ring-1 transition-colors',
                  form.useStimulus
                    ? 'bg-secondary/8 ring-secondary/30'
                    : 'bg-muted/50 ring-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-secondary-ink shadow-card">
                    <Iconify icon="solar:book-2-linear" size={18} />
                  </span>
                  <div>
                    <Label htmlFor="use-stimulus">Gunakan stimulus / bacaan</Label>
                    <p className="text-xs text-muted-foreground">
                      Ditampilkan di panel kiri saat siswa mengerjakan.
                    </p>
                  </div>
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

          <SectionCard
            title="Kunci jawaban"
            description="Tandai jawaban yang benar."
            icon="solar:key-minimalistic-square-linear"
            tone="success"
          >
            <AnswerEditor form={form} update={update} />
          </SectionCard>

          <SectionCard
            title="Pembahasan"
            description="Tampil di halaman pembahasan siswa."
            icon="solar:lightbulb-minimalistic-linear"
            tone="warning"
          >
            <RichTextEditor
              value={form.explanation}
              onChange={(explanation) => update({ explanation })}
              placeholder="Jelaskan langkah penyelesaian (tampil di halaman pembahasan siswa)…"
              aria-label="Pembahasan"
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Pengaturan"
            icon="solar:settings-linear"
            tone="secondary"
            className="xl:sticky xl:top-28"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="q-competency">
                  Kompetensi <span className="font-normal text-muted-foreground">(opsional)</span>
                </Label>
                <SelectField
                  id="q-competency"
                  allLabel="Tanpa kompetensi"
                  value={form.competencyId}
                  // ganti kompetensi → sub kompetensi lama tidak berlaku lagi
                  onChange={(competencyId) => update({ competencyId, subCompetencyId: '' })}
                  options={(master.competencies.data ?? []).map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  }))}
                  placeholder={master.competencies.isFetching ? 'Memuat…' : 'Pilih kompetensi'}
                  disabled={!paket.data}
                  className="sm:w-full"
                />
                {paket.data &&
                  (master.competencies.isSuccess && master.competencies.data.length === 0 ? (
                    <p className="text-xs text-warning">
                      Belum ada kompetensi TKA untuk {paket.data.class_name} ·{' '}
                      {paket.data.subject_name} di master Solutest. Hubungi tim Solutest atau ubah
                      kelas/mapel paket.
                    </p>
                  ) : master.competencies.isError ? (
                    <p className="text-xs text-destructive">
                      Gagal memuat kompetensi.{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => master.competencies.refetch()}
                      >
                        Coba lagi
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Kompetensi TKA {paket.data.class_name} · {paket.data.subject_name}
                    </p>
                  ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-sub-competency">
                  Sub kompetensi{' '}
                  <span className="font-normal text-muted-foreground">(opsional)</span>
                </Label>
                <SelectField
                  id="q-sub-competency"
                  allLabel="Tanpa sub kompetensi"
                  value={form.subCompetencyId}
                  onChange={(subCompetencyId) => update({ subCompetencyId })}
                  options={(master.subCompetencies.data ?? []).map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  }))}
                  placeholder={
                    master.subCompetencies.isFetching ? 'Memuat…' : 'Pilih sub kompetensi'
                  }
                  disabled={!form.competencyId}
                  className="sm:w-full"
                />
                {!form.competencyId && (
                  <p className="text-xs text-muted-foreground">
                    Pilih kompetensi dulu untuk menampilkan sub kompetensinya.
                  </p>
                )}
              </div>
              {locked && (
                <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
                  <Iconify icon="solar:lock-keyhole-linear" size={18} className="mt-0.5" />
                  Paket sudah dikerjakan siswa sehingga soal terkunci. Duplikat paket untuk
                  mengedit.
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive"
                >
                  <Iconify icon="solar:danger-circle-linear" size={18} className="mt-0.5" />
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-2 border-t border-dashed border-border pt-4">
                <Button
                  size="lg"
                  onClick={() => submit(false)}
                  disabled={saveQuestion.isPending || locked}
                >
                  <Iconify
                    icon={
                      saveQuestion.isPending ? 'svg-spinners:180-ring' : 'solar:diskette-linear'
                    }
                    size={18}
                  />
                  Simpan soal
                </Button>
                {!editing && (
                  <Button
                    variant="outline"
                    onClick={() => submit(true)}
                    disabled={saveQuestion.isPending || locked}
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
