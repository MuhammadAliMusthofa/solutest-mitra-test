// Profil akun yang sedang login (semua role).

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  image_profile: string | null;
  role: string;
  /** siswa */
  nisn?: string | null;
  school_name?: string | null;
  class_name?: string | null;
  province_id?: number | null;
  city_id?: number | null;
  created_at?: string;
}

export interface UpdateProfileBody {
  full_name?: string;
  phone?: string | null;
  address?: string | null;
  image_profile?: string | null;
  nisn?: string | null;
  school_name?: string | null;
  class_name?: string | null;
  province_id?: number | null;
  city_id?: number | null;
}

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

export interface RegionOption {
  id: number;
  name: string;
}
