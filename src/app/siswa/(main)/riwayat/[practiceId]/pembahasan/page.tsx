import { redirect } from 'next/navigation';

import { SISWA_PATHS } from 'src/config/paths';

// Pembahasan tryout bersifat rahasia → tidak ditampilkan ke siswa; tautan lama diarahkan ke riwayat.
export default function Page() {
  redirect(SISWA_PATHS.history);
}
