import { redirect } from 'next/navigation';

import { LOGIN_PATH } from 'src/config/roles';

/** `/` diarahkan proxy.ts ke beranda role (bila login) atau /login. Ini hanya cadangan. */
export default function Page() {
  redirect(LOGIN_PATH);
}
