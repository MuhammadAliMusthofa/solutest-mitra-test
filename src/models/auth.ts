import type { Role } from 'src/config/roles';

export interface LoginBody {
  email: string;
  password: string;
}

/** Anggota mitra (respons login, `/auth/me`, daftar guru/siswa). */
export interface MitraUser {
  /** id user Solutest pusat */
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  school_id: number | null;
  school_name: string | null;
  education_level?: string | null;
  nisn: string | null;
  class_name: string | null;
  is_active: boolean;
  created_by: number | null;
  createdAt: string;
  /** hanya saat membuat guru/siswa: akun Solutest baru dibuat */
  is_new_account?: boolean;
}

export interface AuthTokens {
  token: string;
  refresh_token?: string;
  user?: MitraUser;
}

/** Klaim JWT be-solutest-mitra. Otorisasi tetap di backend; FE memakai untuk menu & redirect. */
export interface TokenClaims {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  /** guru & siswa: sekolah anggota (null bila belum diatur admin) */
  school_id: number | null;
  /** cakupan sekolah guru (dari `school_id`) — dipakai mock analitik */
  school_ids?: number[];
  image_profile?: string | null;
  iat?: number;
  exp: number;
}
