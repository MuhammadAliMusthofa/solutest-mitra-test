import type { Role } from 'src/config/roles';

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  refresh_token?: string;
}

export interface TenantClaim {
  id: string;
  name: string;
  slug: string;
}

/** Klaim JWT yang dibaca FE (lihat docs/api-contract.md §2). */
export interface TokenClaims {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  tenant: TenantClaim;
  /** guru: sekolah yang diampu (scope analitik) */
  school_ids?: number[];
  image_profile?: string | null;
  iat?: number;
  exp: number;
}
