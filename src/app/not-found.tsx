import Link from 'next/link';

import { Button } from 'src/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-7xl font-bold text-primary/20">404</p>
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-muted-foreground">
        Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
