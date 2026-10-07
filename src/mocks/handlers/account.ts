// Auth, branding mitra, profil, dan upload file (mode mock).

import type { MockAccount } from '../db';
import type { MockContext } from '../utils';
import type { TokenClaims } from 'src/models/auth';
import type { UpdateTenantBody } from 'src/models/tenant';
import type { UserProfile, UpdateProfileBody, ChangePasswordBody } from 'src/models/user';

import { ROLES } from 'src/config/roles';

import { loadDb, mutateDb } from '../db';
import { fail, requireUser, createMockToken } from '../utils';

const findAccount = (email: string) =>
  loadDb().accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

const claimsOf = (a: MockAccount): Omit<TokenClaims, 'exp' | 'iat'> => {
  const { tenant } = loadDb();
  return {
    id: a.id,
    email: a.email,
    full_name: a.full_name,
    role: a.role,
    tenant: { id: tenant.id, name: tenant.name, slug: 'kota-tegal' },
    ...(a.role === ROLES.guru ? { school_ids: a.school_ids ?? [] } : {}),
    image_profile: a.image_profile,
  };
};

const issue = (a: MockAccount) => ({
  token: createMockToken(claimsOf(a)),
  refresh_token: `mock-refresh-${a.id}`,
});

// ------------------------------------------------------------------ auth
export const login = ({ body }: MockContext) => {
  const account = findAccount(String(body?.email ?? ''));
  if (!account || account.password !== body?.password) fail(401, 'Email atau password salah');
  if (account!.status === 'inactive') fail(403, 'Akun dinonaktifkan. Hubungi admin mitra.');
  return issue(account!);
};

export const refresh = (ctx: MockContext) => {
  const id =
    ctx.user?.id ??
    Number(
      String(ctx.body?.refresh_token ?? '')
        .split('-')
        .pop()
    );
  const account = loadDb().accounts.find((a) => a.id === id);
  if (!account) return fail(401, 'Sesi berakhir, silakan login kembali');
  return issue(account);
};

// ------------------------------------------------------------------ branding mitra
export const getBranding = () => loadDb().tenant;

export const updateBranding = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const body = (ctx.body ?? {}) as UpdateTenantBody;
  if (body.name !== undefined && !body.name.trim()) fail(422, 'Nama mitra wajib diisi');
  return mutateDb((db) => {
    db.tenant = {
      ...db.tenant,
      ...body,
      theme: { ...db.tenant.theme, ...(body.theme ?? {}) },
      updated_at: new Date().toISOString(),
    };
    return db.tenant;
  });
};

// ------------------------------------------------------------------ profil
const currentAccount = (ctx: MockContext) => {
  const user = requireUser(ctx);
  const account = loadDb().accounts.find((a) => a.id === user.id);
  return account ?? fail(404, 'Akun tidak ditemukan');
};

const toProfile = (a: MockAccount): UserProfile => ({
  id: a.id,
  email: a.email,
  full_name: a.full_name,
  phone: a.phone,
  address: a.address,
  image_profile: a.image_profile,
  role: a.role,
  nisn: a.nisn ?? null,
  school_name: a.school_name ?? null,
  class_name: a.class_name ?? null,
  province_id: a.province_id ?? null,
  city_id: a.city_id ?? null,
  created_at: a.created_at,
});

export const getProfile = (ctx: MockContext) => toProfile(currentAccount(ctx));

export const updateProfile = (ctx: MockContext) => {
  const { id } = currentAccount(ctx);
  const body = (ctx.body ?? {}) as UpdateProfileBody;
  if (body.full_name !== undefined && !body.full_name.trim()) fail(422, 'Nama wajib diisi');
  return mutateDb((db) => {
    const account = db.accounts.find((a) => a.id === id)!;
    Object.assign(account, body);
    return toProfile(account);
  });
};

export const changePassword = (ctx: MockContext) => {
  const { id, password } = currentAccount(ctx);
  const body = (ctx.body ?? {}) as ChangePasswordBody;
  if (body.current_password !== password) fail(422, 'Password saat ini salah');
  if ((body.new_password ?? '').length < 8) fail(422, 'Password baru minimal 8 karakter');
  mutateDb((db) => {
    db.accounts.find((a) => a.id === id)!.password = body.new_password;
  });
  return { changed: true };
};

// ------------------------------------------------------------------ upload
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Simulasi upload: file dikembalikan sebagai data URL (disimpan apa adanya di localStorage). */
export const upload = async (ctx: MockContext) => {
  requireUser(ctx);
  const file = (ctx.body as FormData)?.get?.('file');
  if (!(file instanceof File)) return fail(422, 'File tidak ditemukan');
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type))
    fail(422, 'Format harus PNG, JPG, WEBP, atau SVG');
  if (file.size > MAX_UPLOAD_BYTES) fail(422, 'Ukuran file maksimal 2 MB');
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
  return { url };
};
