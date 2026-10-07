'use client';

import type { UserProfile } from 'src/models/user';

import { z } from 'zod';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import { Textarea } from 'src/components/ui/textarea';
import { Tabs, TabsList, TabsContent, TabsTrigger } from 'src/components/ui/tabs';

import type { Role } from 'src/config/roles';
import { ROLES, ROLE_LABEL } from 'src/config/roles';

import { errorMessage, refreshToken } from 'src/core/http';

import { useTenant } from 'src/hooks/use-tenant';
import { useUrlState } from 'src/hooks/use-url-state';
import { useCurrentUser } from 'src/hooks/use-session';

import { formatLongDate } from 'src/utils/format';

import { profileService } from 'src/services/account';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { ImageUploader } from 'src/components/form/image-uploader';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { PageHeader } from 'src/components/data-display/page-header';
import { SectionCard } from 'src/components/data-display/section-card';

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Nama wajib diisi'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d{8,15})?$/, 'Nomor HP 8–15 digit')
    .optional(),
  address: z.string().trim().max(200).optional(),
  nisn: z
    .string()
    .trim()
    .regex(/^(\d{10})?$/, 'NISN harus 10 digit')
    .optional(),
  school_name: z.string().trim().optional(),
  class_name: z.string().trim().optional(),
  image_profile: z.string().nullable().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Isi password saat ini'),
    new_password: z.string().min(8, 'Minimal 8 karakter'),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ['confirm'],
    message: 'Konfirmasi password tidak sama',
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function EditProfileForm({ profile, isStudent }: { profile: UserProfile; isStudent: boolean }) {
  const qc = useQueryClient();
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });
  const { errors, isDirty } = form.formState;
  const image = useWatch({ control: form.control, name: 'image_profile' });

  useEffect(() => {
    form.reset({
      full_name: profile.full_name,
      phone: profile.phone ?? '',
      address: profile.address ?? '',
      nisn: profile.nisn ?? '',
      school_name: profile.school_name ?? '',
      class_name: profile.class_name ?? '',
      image_profile: profile.image_profile,
    });
  }, [profile, form]);

  const save = useMutation({
    mutationFn: (v: ProfileValues) =>
      profileService.update({
        full_name: v.full_name,
        phone: v.phone || null,
        address: v.address || null,
        image_profile: v.image_profile ?? null,
        ...(isStudent
          ? {
              nisn: v.nisn || null,
              school_name: v.school_name || null,
              class_name: v.class_name || null,
            }
          : {}),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['profile', 'me'], data);
      // perbarui klaim token (nama & foto di topbar/sidebar)
      refreshToken();
      toast.success('Profil diperbarui');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label>Foto profil</Label>
        <ImageUploader
          shape="circle"
          value={image ?? null}
          onChange={(url) => form.setValue('image_profile', url, { shouldDirty: true })}
          label="Unggah foto"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-name">Nama lengkap</Label>
          <Input
            id="p-name"
            {...form.register('full_name')}
            aria-invalid={Boolean(errors.full_name)}
          />
          <FieldError message={errors.full_name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" value={profile.email} disabled />
          <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-phone">No. HP</Label>
          <Input
            id="p-phone"
            inputMode="tel"
            {...form.register('phone')}
            aria-invalid={Boolean(errors.phone)}
          />
          <FieldError message={errors.phone?.message} />
        </div>
        {isStudent && (
          <>
            <div className="space-y-2">
              <Label htmlFor="p-nisn">NISN</Label>
              <Input
                id="p-nisn"
                inputMode="numeric"
                {...form.register('nisn')}
                aria-invalid={Boolean(errors.nisn)}
              />
              <FieldError message={errors.nisn?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-class">Kelas</Label>
              <Input id="p-class" {...form.register('class_name')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="p-school">Sekolah</Label>
              <Input id="p-school" {...form.register('school_name')} />
            </div>
          </>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-address">Alamat</Label>
          <Textarea id="p-address" rows={3} {...form.register('address')} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || save.isPending}>
          {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}

function ChangePasswordForm() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm: '' },
  });
  const { errors } = form.formState;
  const save = useMutation({
    mutationFn: (v: PasswordValues) =>
      profileService.changePassword({
        current_password: v.current_password,
        new_password: v.new_password,
      }),
    onSuccess: () => {
      toast.success('Password berhasil diganti');
      form.reset();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <form
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
      className="max-w-md space-y-4"
      noValidate
    >
      {(
        [
          ['current_password', 'Password saat ini', 'current-password'],
          ['new_password', 'Password baru', 'new-password'],
          ['confirm', 'Ulangi password baru', 'new-password'],
        ] as const
      ).map(([name, label, auto]) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={`pw-${name}`}>{label}</Label>
          <Input
            id={`pw-${name}`}
            type="password"
            autoComplete={auto}
            {...form.register(name)}
            aria-invalid={Boolean(errors[name])}
          />
          <FieldError message={errors[name]?.message} />
        </div>
      ))}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
        Ganti password
      </Button>
    </form>
  );
}

/** Profil Saya — dipakai admin, guru, dan siswa (`?tab=edit|keamanan`). */
export function ProfileContainer({ homeHref }: { homeHref: string }) {
  const { branding } = useTenant();
  const role = useCurrentUser().user?.role as Role | undefined;
  const [{ tab }, setUrl] = useUrlState({ tab: 'edit' });
  const query = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.me });
  const p = query.data;
  const isStudent = role === ROLES.siswa;

  return (
    <>
      <PageHeader
        title="Profil Saya"
        crumbs={[{ label: 'Beranda', href: homeHref }, { label: 'Profil' }]}
      />
      {query.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {query.isError && (
        <SectionCard>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </SectionCard>
      )}
      {p && (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <section className="h-fit overflow-hidden rounded-card bg-card shadow-card">
            <div className="h-24 bg-gradient-to-r from-primary to-secondary" />
            <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
              <span className="rounded-full ring-4 ring-card">
                <UserAvatar name={p.full_name} src={p.image_profile} size={96} />
              </span>
              <h2 className="mt-3 text-lg font-semibold">{p.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {role ? ROLE_LABEL[role] : ''} · {branding.short_name || branding.name}
              </p>
              <dl className="mt-5 w-full space-y-2 text-left text-sm">
                {[
                  ['solar:letter-linear', p.email],
                  ['solar:phone-linear', p.phone || 'Belum diisi'],
                  ...(isStudent
                    ? [
                        [
                          'solar:square-academic-cap-linear',
                          [p.school_name, p.class_name].filter(Boolean).join(' · ') ||
                            'Belum diisi',
                        ],
                      ]
                    : []),
                  ['solar:calendar-linear', `Bergabung ${formatLongDate(p.created_at)}`],
                ].map(([icon, text]) => (
                  <div
                    key={icon}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <Iconify icon={icon} size={18} className="text-muted-foreground" />
                    <span className="truncate">{text}</span>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <SectionCard>
            <Tabs value={tab} onValueChange={(v) => setUrl({ tab: v })} className="gap-5">
              <TabsList>
                <TabsTrigger value="edit">Ubah profil</TabsTrigger>
                <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <EditProfileForm profile={p} isStudent={isStudent} />
              </TabsContent>
              <TabsContent value="keamanan">
                <ChangePasswordForm />
              </TabsContent>
            </Tabs>
          </SectionCard>
        </div>
      )}
    </>
  );
}
