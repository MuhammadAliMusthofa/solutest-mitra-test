'use client';

import type { ThemeConfig, SidebarStyle } from 'src/models/tenant';

import { toast } from 'sonner';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import { Tabs, TabsList, TabsContent, TabsTrigger } from 'src/components/ui/tabs';

import { DEFAULT_THEME, THEME_PRESETS, RADIUS_OPTIONS } from 'src/config/theme';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';
import { useTenant, TENANT_QUERY_KEY } from 'src/hooks/use-tenant';

import { cn } from 'src/lib/utils';
import { contrastWarnings } from 'src/utils/theme';

import { tenantService } from 'src/services/account';

import { Iconify } from 'src/components/iconify/iconify';
import { ImageUploader } from 'src/components/form/image-uploader';
import { PageHeader } from 'src/components/data-display/page-header';
import { SectionCard } from 'src/components/data-display/section-card';

import { ColorField } from '../components/color-field';
import { ThemePreview } from '../components/theme-preview';

const COLOR_FIELDS: { key: keyof ThemeConfig; label: string; hint: string }[] = [
  { key: 'primary', label: 'Warna utama', hint: 'Tombol, menu aktif, tautan, chart utama' },
  { key: 'secondary', label: 'Warna sekunder', hint: 'Tombol sekunder, seri chart kedua' },
  { key: 'accent', label: 'Warna aksen', hint: 'Sorotan, badge, aksen menu' },
  { key: 'background', label: 'Latar halaman', hint: 'Warna dasar di belakang kartu' },
  { key: 'success', label: 'Sukses', hint: 'Status berhasil / naik / benar' },
  { key: 'warning', label: 'Peringatan', hint: 'Status perlu perhatian' },
  { key: 'danger', label: 'Bahaya', hint: 'Hapus, error, turun / salah' },
];

const SIDEBAR_OPTIONS: { value: SidebarStyle; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'brand', label: 'Warna utama' },
  { value: 'dark', label: 'Gelap' },
];

const same = (a: ThemeConfig, b: ThemeConfig) => JSON.stringify(a) === JSON.stringify(b);

/** Pengaturan Mitra (admin): profil & logo mitra + tema warna aplikasi untuk semua user mitra. */
export function PengaturanContainer() {
  const qc = useQueryClient();
  const { paths } = usePanel();
  const { branding, isPending } = useTenant();
  const [profile, setProfile] = useState({
    name: '',
    short_name: '',
    tagline: '',
    logo_url: null as string | null,
  });
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

  // isi form saat data tenant pertama kali dimuat / berubah dari server (versi = updated_at)
  const version = isPending ? null : (branding.updated_at ?? branding.id);
  const [loadedVersion, setLoadedVersion] = useState<string | null>(null);
  if (version && version !== loadedVersion) {
    setLoadedVersion(version);
    setProfile({
      name: branding.name,
      short_name: branding.short_name,
      tagline: branding.tagline,
      logo_url: branding.logo_url,
    });
    setTheme(branding.theme);
  }

  const save = useMutation({
    mutationFn: tenantService.update,
    onSuccess: (data) => {
      qc.setQueryData(TENANT_QUERY_KEY, data);
      toast.success('Pengaturan mitra disimpan dan diterapkan ke semua pengguna');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const profileDirty =
    profile.name !== branding.name ||
    profile.short_name !== branding.short_name ||
    profile.tagline !== branding.tagline ||
    profile.logo_url !== branding.logo_url;
  const themeDirty = !same(theme, branding.theme);
  const warnings = contrastWarnings(theme);

  if (isPending) return <Skeleton className="h-[70vh] w-full rounded-card" />;

  return (
    <>
      <PageHeader
        title="Pengaturan Mitra"
        description="Identitas & tema berlaku untuk seluruh admin, guru, dan siswa mitra."
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Akun' },
          { label: 'Pengaturan Mitra' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <Tabs defaultValue="profil" className="gap-4">
          <TabsList className="h-12 w-full justify-start bg-card p-1.5 shadow-card ring-0 sm:w-fit">
            <TabsTrigger value="profil" className="h-9 px-4">
              <Iconify icon="solar:buildings-2-linear" size={18} />
              Profil & logo
            </TabsTrigger>
            <TabsTrigger value="tema" className="h-9 px-4">
              <Iconify icon="solar:pallete-2-linear" size={18} />
              Tema & warna
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <SectionCard
              title="Profil mitra"
              description="Logo tampil di sidebar admin & guru, navbar siswa, dan halaman login."
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Logo mitra</Label>
                  <ImageUploader
                    value={profile.logo_url}
                    onChange={(logo_url) => setProfile((p) => ({ ...p, logo_url }))}
                    label="Unggah logo"
                    hint="Disarankan persegi (min. 256×256), latar transparan · maks 2 MB"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="m-name">Nama mitra</Label>
                    <Input
                      id="m-name"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-short">Nama singkat</Label>
                    <Input
                      id="m-short"
                      value={profile.short_name}
                      maxLength={24}
                      onChange={(e) => setProfile((p) => ({ ...p, short_name: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dipakai di sidebar & navbar (maks 24 karakter).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-tagline">Tagline</Label>
                    <Input
                      id="m-tagline"
                      value={profile.tagline}
                      maxLength={80}
                      onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Tampil di halaman login.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={!profileDirty}
                    onClick={() =>
                      setProfile({
                        name: branding.name,
                        short_name: branding.short_name,
                        tagline: branding.tagline,
                        logo_url: branding.logo_url,
                      })
                    }
                  >
                    Batalkan
                  </Button>
                  <Button
                    disabled={!profileDirty || !profile.name.trim() || save.isPending}
                    onClick={() =>
                      save.mutate({
                        ...profile,
                        name: profile.name.trim(),
                        short_name: profile.short_name.trim(),
                      })
                    }
                  >
                    {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
                    Simpan profil
                  </Button>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="tema" className="space-y-6">
            <SectionCard title="Preset tema">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {THEME_PRESETS.map((p) => {
                  const active = same({ ...p.theme, radius: theme.radius }, theme);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTheme({ ...p.theme, radius: theme.radius })}
                      className={cn(
                        'rounded-xl p-3 text-left ring-1 ring-border transition-colors hover:ring-primary/40',
                        active && 'ring-2 ring-primary'
                      )}
                    >
                      <span className="flex gap-1">
                        {[
                          p.theme.primary,
                          p.theme.secondary,
                          p.theme.accent,
                          p.theme.background,
                        ].map((c) => (
                          <span
                            key={c}
                            className="h-7 flex-1 rounded-md ring-1 ring-black/5"
                            style={{ background: c }}
                          />
                        ))}
                      </span>
                      <span className="mt-2 block text-sm font-medium">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Warna"
              description="Warna teks di atas tombol dihitung otomatis agar tetap terbaca."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {COLOR_FIELDS.map((f) => (
                  <ColorField
                    key={f.key}
                    label={f.label}
                    hint={f.hint}
                    value={theme[f.key] as string}
                    onChange={(hex) => setTheme((t) => ({ ...t, [f.key]: hex }))}
                  />
                ))}
              </div>
              {warnings.length > 0 && (
                <ul className="mt-4 space-y-1 rounded-xl bg-warning/8 p-4 text-sm text-warning">
                  {warnings.map((w) => (
                    <li key={w} className="flex gap-2">
                      <Iconify icon="solar:danger-triangle-linear" size={18} className="shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Tampilan">
              <div className="grid gap-6 md:grid-cols-2">
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Gaya sidebar</legend>
                  <div className="flex rounded-lg bg-muted p-1">
                    {SIDEBAR_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={theme.sidebar === o.value}
                        onClick={() => setTheme((t) => ({ ...t, sidebar: o.value }))}
                        className={cn(
                          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium',
                          theme.sidebar === o.value
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-muted-foreground'
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Sudut komponen</legend>
                  <div className="flex rounded-lg bg-muted p-1">
                    {RADIUS_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={theme.radius === o.value}
                        onClick={() => setTheme((t) => ({ ...t, radius: o.value }))}
                        className={cn(
                          'flex-1 rounded-md px-3 py-1.5 text-sm font-medium',
                          theme.radius === o.value
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-muted-foreground'
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </SectionCard>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setTheme(DEFAULT_THEME)}
                disabled={same(theme, DEFAULT_THEME)}
              >
                <Iconify icon="solar:restart-linear" size={18} />
                Kembalikan tema Solutest
              </Button>
              <Button
                variant="outline"
                onClick={() => setTheme(branding.theme)}
                disabled={!themeDirty}
              >
                Batalkan perubahan
              </Button>
              <Button
                onClick={() => save.mutate({ theme })}
                disabled={!themeDirty || save.isPending}
              >
                {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
                Terapkan tema
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="xl:sticky xl:top-28 xl:h-fit">
          <SectionCard
            title="Pratinjau"
            description={themeDirty || profileDirty ? 'Belum disimpan' : 'Sesuai pengaturan aktif'}
          >
            <ThemePreview
              theme={theme}
              name={profile.name}
              shortName={profile.short_name}
              logo={profile.logo_url}
            />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
