'use client';

import type { ImportStudentResult } from 'src/models/member';
import type { ParsedRow, ParseResult, ImportRowFilter } from '../helpers/import-siswa';

import Link from 'next/link';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from 'src/components/ui/table';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';

import { cn } from 'src/lib/utils';

import { memberService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { SectionCard } from 'src/components/data-display/section-card';

import {
  parseTable,
  IMPORT_ACCEPT,
  importColumns,
  resolveSchool,
  readSpreadsheet,
  splitParsedRows,
  MAX_IMPORT_ROWS,
  downloadTemplate,
  IMPORT_BATCH_SIZE,
  validateImportFile,
  MAX_IMPORT_FILE_MB,
} from '../helpers/import-siswa';

const STATUS_LABEL = {
  created: { label: 'Akun baru', tone: 'success' },
  existing_account: { label: 'Akun Solutest lama', tone: 'info' },
  skipped: { label: 'Dilewati', tone: 'warning' },
  failed: { label: 'Gagal', tone: 'danger' },
} as const;

const mergeResults = (a: ImportStudentResult | null, b: ImportStudentResult, offset: number) => ({
  summary: {
    total: (a?.summary.total ?? 0) + b.summary.total,
    created: (a?.summary.created ?? 0) + b.summary.created,
    existing_account: (a?.summary.existing_account ?? 0) + b.summary.existing_account,
    skipped: (a?.summary.skipped ?? 0) + b.summary.skipped,
    failed: (a?.summary.failed ?? 0) + b.summary.failed,
  },
  results: [...(a?.results ?? []), ...b.results.map((r) => ({ ...r, row: r.row + offset }))],
});

const STEPS = ['Unduh template', 'Unggah file', 'Periksa & kirim'];

export function ImportSiswaContainer() {
  const qc = useQueryClient();
  const { panel, isAdmin, paths } = usePanel();
  const columns = importColumns(isAdmin);
  const schools = useQuery({
    queryKey: ['member', 'schools', 'options'],
    queryFn: memberService.schools,
    enabled: isAdmin,
  });
  const [defaultSchool, setDefaultSchool] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [filter, setFilter] = useState<ImportRowFilter>('all');
  const [result, setResult] = useState<ImportStudentResult | null>(null);
  const [dragging, setDragging] = useState(false);
  // admin: kolom sekolah dicocokkan ke sekolah mitra (kosong = sekolah bawaan yang dipilih)
  const withSchool: ParseResult | null =
    parsed && isAdmin
      ? {
          ...parsed,
          rows: parsed.rows.map((r): ParsedRow => {
            const school = resolveSchool(
              r.data.school,
              schools.data ?? [],
              Number(defaultSchool) || undefined
            );
            return school.error ? { ...r, errors: [...r.errors, school.error] } : r;
          }),
        }
      : parsed;
  const { all, valid, invalid, visible } = splitParsedRows(withSchool, filter);
  const step = result ? 3 : parsed ? 2 : 1;

  const submit = useMutation({
    mutationFn: async () => {
      const rows = valid.map((r) => ({
        ...r.data,
        school_id: isAdmin
          ? resolveSchool(r.data.school, schools.data ?? [], Number(defaultSchool) || undefined).id
          : undefined,
      }));
      let merged: ImportStudentResult | null = null;
      setProgress({ done: 0, total: rows.length });
      for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
        const res = await memberService.importStudents(
          panel,
          rows.slice(i, i + IMPORT_BATCH_SIZE),
          Number(defaultSchool) || undefined
        );
        merged = mergeResults(merged, res, i);
        setProgress({ done: Math.min(i + IMPORT_BATCH_SIZE, rows.length), total: rows.length });
      }
      return merged as ImportStudentResult;
    },
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ['member'] });
      toast.success(
        `${res.summary.created + res.summary.existing_account} siswa ditambahkan ke mitra`
      );
    },
    onError: (err) => toast.error(errorMessage(err)),
    onSettled: () => setProgress(null),
  });

  const handleFile = async (file?: File) => {
    if (!file) return;
    const problem = validateImportFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const table = await readSpreadsheet(file);
      const res = parseTable(table);
      setFileName(file.name);
      setParsed(res);
      setResult(null);
      setFilter(res.rows.some((r) => r.errors.length) ? 'invalid' : 'all');
      if (res.missingColumns.length)
        toast.error(`Kolom wajib tidak ditemukan: ${res.missingColumns.join(', ')}`);
    } catch {
      toast.error('File tidak dapat dibaca. Pastikan format sesuai template.');
    }
  };

  const reset = () => {
    setParsed(null);
    setResult(null);
    setFileName('');
  };

  return (
    <>
      <PageHeader
        title="Import Siswa"
        backHref={paths.siswa}
        crumbs={[{ label: 'Siswa', href: paths.siswa }, { label: 'Import' }]}
      />

      <ol className="mb-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n || (n === 3 && result);
          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3 rounded-card bg-card p-4 shadow-card',
                step === n && 'ring-2 ring-primary'
              )}
            >
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-full text-sm font-semibold',
                  done
                    ? 'bg-success text-white'
                    : step === n
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <Iconify icon="solar:check-read-linear" size={18} /> : n}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <SectionCard title="1. Template">
            <p className="text-sm text-muted-foreground">
              Kolom wajib: <b>nama, email</b>. Password (≥ 6 karakter) wajib untuk email yang belum
              punya akun Solutest; email yang sudah terdaftar memakai akun lamanya. Opsional: NISN
              (10 digit), kelas, no. HP
              {isAdmin ? ', sekolah (nama/NPSN sekolah mitra)' : ''}. Maks {MAX_IMPORT_ROWS} baris ·{' '}
              {MAX_IMPORT_FILE_MB} MB.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadTemplate('xlsx', isAdmin)}>
                <Iconify icon="solar:file-download-linear" size={18} />
                Template .xlsx
              </Button>
              <Button variant="outline" onClick={() => downloadTemplate('csv', isAdmin)}>
                <Iconify icon="solar:file-download-linear" size={18} />
                Template .csv
              </Button>
            </div>
          </SectionCard>

          {isAdmin && (
            <SectionCard title="Sekolah bawaan">
              <p className="mb-3 text-sm text-muted-foreground">
                Dipakai untuk baris yang kolom sekolahnya kosong.
              </p>
              <SelectField
                aria-label="Sekolah bawaan"
                value={defaultSchool}
                onChange={setDefaultSchool}
                options={(schools.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
                placeholder={schools.isPending ? 'Memuat sekolah…' : 'Pilih sekolah'}
                className="sm:w-full"
              />
            </SectionCard>
          )}

          <SectionCard title="2. Unggah file">
            <label
              htmlFor="import-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary/50',
                dragging && 'border-primary bg-primary/5'
              )}
            >
              <Iconify icon="solar:cloud-upload-linear" size={36} className="text-primary" />
              <span className="text-sm font-medium">
                {fileName || 'Seret file ke sini atau klik untuk memilih'}
              </span>
              <span className="text-xs text-muted-foreground">.xlsx, .xls, atau .csv</span>
            </label>
            <input
              ref={inputRef}
              id="import-file"
              type="file"
              accept={IMPORT_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </SectionCard>
        </div>

        <SectionCard
          title="3. Periksa data"
          description={
            parsed
              ? `${all.length} baris dibaca dari ${fileName}${parsed.truncated ? ` (dipotong ke ${MAX_IMPORT_ROWS} baris)` : ''}`
              : 'Pratinjau muncul setelah file diunggah.'
          }
          action={
            parsed && !result ? (
              <div className="flex rounded-lg bg-muted p-1 text-sm">
                {(
                  [
                    ['all', `Semua (${all.length})`],
                    ['valid', `Valid (${valid.length})`],
                    ['invalid', `Bermasalah (${invalid.length})`],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilter(k)}
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium',
                      filter === k ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null
          }
        >
          {!parsed && (
            <div className="grid place-items-center py-16 text-center text-sm text-muted-foreground">
              <Iconify
                icon="solar:document-text-linear"
                size={40}
                className="mb-2 text-muted-foreground/60"
              />
              Belum ada file.
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ['Akun baru', result.summary.created, 'bg-success/8 text-success'],
                    ['Akun lama', result.summary.existing_account, 'bg-info/8 text-info'],
                    ['Dilewati', result.summary.skipped, 'bg-warning/8 text-warning'],
                    ['Gagal', result.summary.failed, 'bg-destructive/8 text-destructive'],
                  ] as const
                ).map(([label, n, tone]) => (
                  <div key={label} className={cn('rounded-xl p-4', tone)}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold">{n}</p>
                  </div>
                ))}
              </div>
              {result.results.some((r) => r.status === 'skipped' || r.status === 'failed') && (
                <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl bg-muted/50 p-4 text-sm">
                  {result.results
                    .filter((r) => r.status === 'skipped' || r.status === 'failed')
                    .map((r) => (
                      <li key={`${r.row}-${r.email}`} className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={STATUS_LABEL[r.status].tone}>
                          {STATUS_LABEL[r.status].label}
                        </StatusPill>
                        Baris {r.row} · {r.email}:
                        <span className="text-destructive">{r.error}</span>
                      </li>
                    ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={paths.siswa}>Lihat daftar siswa</Link>
                </Button>
                <Button variant="outline" onClick={reset}>
                  Import file lain
                </Button>
              </div>
            </div>
          )}

          {parsed && !result && (
            <>
              <div className="max-h-[480px] overflow-auto rounded-xl ring-1 ring-border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="w-14">Baris</TableHead>
                      {columns
                        .filter((c) => c.key !== 'password')
                        .map((c) => (
                          <TableHead key={c.key} className="text-xs uppercase">
                            {c.header}
                          </TableHead>
                        ))}
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow key={r.line} className={cn(r.errors.length && 'bg-destructive/4')}>
                        <TableCell className="text-xs text-muted-foreground">{r.line}</TableCell>
                        <TableCell>{r.data.name || '-'}</TableCell>
                        <TableCell className="text-xs">{r.data.email || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.data.nisn || '-'}</TableCell>
                        <TableCell>{r.data.class || '-'}</TableCell>
                        <TableCell className="text-xs">{r.data.phone || '-'}</TableCell>
                        {isAdmin && <TableCell>{r.data.school || '(bawaan)'}</TableCell>}
                        <TableCell>
                          {r.errors.length ? (
                            <div className="space-y-0.5">
                              {r.errors.map((e) => (
                                <p key={e} className="text-xs text-destructive">
                                  {e}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <StatusPill tone="success" icon="solar:check-circle-linear">
                              Valid
                            </StatusPill>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {progress
                    ? `Mengirim ${progress.done}/${progress.total} baris…`
                    : invalid.length
                      ? `${invalid.length} baris bermasalah tidak akan dikirim.`
                      : 'Semua baris valid.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={reset}>
                    Batal
                  </Button>
                  <Button
                    disabled={
                      !valid.length || Boolean(parsed.missingColumns.length) || submit.isPending
                    }
                    onClick={() => submit.mutate()}
                  >
                    {submit.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
                    Tambahkan {valid.length} siswa
                  </Button>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </>
  );
}
