'use client';

import { Button } from 'src/components/ui/button';
import { Dialog, DialogTitle, DialogContent, DialogDescription } from 'src/components/ui/dialog';

import { Iconify } from 'src/components/iconify/iconify';

const CHEAT_RULES = [
  {
    title: 'Jangan buka tab lain:',
    body: 'Setiap tab yang tidak relevan dapat dianggap sebagai upaya kecurangan.',
  },
  {
    title: 'Pastikan layar tidak mati:',
    body: 'Jika layar perangkat Anda mati selama ujian, itu akan terdeteksi dan bisa menyebabkan penghapusan jawaban.',
  },
  {
    title: 'Jangan keluar dari mode fullscreen (menekan tombol ESC):',
    body: 'Jika Anda keluar dari mode fullscreen, itu akan terdeteksi dan bisa menyebabkan penghapusan jawaban.',
  },
  {
    title: 'Hindari mode duplikasi layar:',
    body: 'Menggunakan layar duplikat juga akan mengindikasikan kecurangan.',
  },
];

const BASIC_RULES = [
  {
    title: 'Pastikan koneksi stabil:',
    body: 'Jawaban tersimpan otomatis setiap berpindah soal.',
  },
  {
    title: 'Waktu terus berjalan:',
    body: 'Waktu dihitung sejak tryout dimulai dan tidak berhenti walau halaman ditutup.',
  },
  {
    title: 'Kumpulkan sebelum waktu habis:',
    body: 'Saat waktu habis, jawaban yang tersimpan dikumpulkan otomatis.',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cheatDetection: boolean;
  maxViolations: number;
  loading?: boolean;
  onConfirm: () => void;
}

/** Peringatan wajib sebelum memulai tryout (aturan deteksi kecurangan). */
export function ExamRulesDialog({
  open,
  onOpenChange,
  cheatDetection,
  maxViolations,
  loading,
  onConfirm,
}: Props) {
  const rules = cheatDetection ? CHEAT_RULES : BASIC_RULES;
  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-32 place-items-center rounded-full bg-[color-mix(in_srgb,var(--chart-2)_12%,white)]">
            <span className="grid size-20 -rotate-6 place-items-center rounded-3xl bg-primary/35 text-primary">
              <Iconify icon="solar:notebook-bold-duotone" size={48} />
            </span>
          </span>
          <DialogTitle className="mt-5 flex items-center justify-center gap-2 text-xl">
            <Iconify icon="solar:danger-triangle-bold" size={24} className="text-warning" />
            Peringatan Penting Sebelum Memulai Ujian Tryout
          </DialogTitle>
          <DialogDescription className="mt-4 max-w-md text-base leading-relaxed text-foreground/80">
            {cheatDetection
              ? 'Perhatian! Jika Anda melanggar ketentuan berikut, kami akan mendeteksi kecurangan dan semua jawaban Anda akan terhapus.'
              : 'Perhatian! Baca ketentuan berikut sebelum mulai mengerjakan.'}
          </DialogDescription>
        </div>

        <div className="mt-2">
          <p className="font-bold">Pastikan untuk mematuhi aturan berikut:</p>
          <ul className="mt-3 list-disc space-y-3 pl-6 leading-relaxed text-foreground/85">
            {rules.map((r) => (
              <li key={r.title}>
                <span className="font-bold text-foreground">{r.title}</span> {r.body}
              </li>
            ))}
            {cheatDetection && (
              <li>
                <span className="font-bold text-foreground">Batas pelanggaran:</span> pelanggaran
                ke-{maxViolations} membuat tryout dikumpulkan otomatis.
              </li>
            )}
          </ul>
          <p className="mt-6 text-center font-bold">
            Bersiaplah dengan baik dan berikan yang terbaik! Sukses untuk ujian Anda!
          </p>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-lg"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="flex-1 rounded-lg"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <Iconify icon="svg-spinners:180-ring" size={18} />
            ) : (
              <Iconify icon="solar:play-bold" size={18} />
            )}
            Saya mengerti, mulai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
