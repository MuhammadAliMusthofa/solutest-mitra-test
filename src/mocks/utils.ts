import type { Paginated } from 'src/models/api';
import type { TokenClaims } from 'src/models/auth';

import { ROLES } from 'src/config/roles';
import type { Role } from 'src/config/roles';

export class MockHttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const fail = (status: number, message: string): never => {
  throw new MockHttpError(status, message);
};

export interface MockContext {
  method: string;
  path: string;
  /** query string */
  query: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- body request JSON/FormData bebas bentuk
  body: any;
  /** segmen dinamis route, mis. `:id` */
  params: Record<string, string>;
  user: TokenClaims | null;
}

export const requireUser = (ctx: MockContext, roles?: Role[]): TokenClaims => {
  if (!ctx.user) return fail(401, 'Sesi berakhir, silakan login kembali');
  if (roles && !roles.includes(ctx.user.role)) return fail(403, 'Akses ditolak untuk role ini');
  return ctx.user;
};

export const PANEL_ROLES: Role[] = [ROLES.admin, ROLES.guru];

/** Sekolah yang boleh dilihat user (guru dibatasi, admin semua). */
export const schoolScope = (user: TokenClaims | null): number[] | undefined =>
  user?.role === ROLES.guru ? (user.school_ids ?? []) : undefined;

export const paginate = <T>(
  list: T[],
  page?: number | string,
  perPage?: number | string
): Paginated<T> => {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(perPage) || 10);
  return {
    data: list.slice((p - 1) * size, p * size),
    pagination: {
      current_page: p,
      per_page: size,
      total_items: list.length,
      total_pages: Math.max(1, Math.ceil(list.length / size)),
    },
  };
};

export const matches = (value: string, search?: string) =>
  !search || value.toLowerCase().includes(String(search).toLowerCase());
