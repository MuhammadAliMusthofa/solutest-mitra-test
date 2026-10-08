/* eslint-disable @next/next/no-img-element -- ilustrasi dekoratif statis */

import type { ReactNode } from 'react';

import { cn } from 'src/lib/utils';

interface Props {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  /** tint = latar primary lembut; brand = latar primary penuh, teks terang */
  variant?: 'tint' | 'brand';
  className?: string;
}

/** Kartu sapaan ala Spike dengan ilustrasi di kanan bawah (disembunyikan bila kartu sempit). */
export function WelcomeCard({ title, subtitle, children, variant = 'tint', className }: Props) {
  const brand = variant === 'brand';
  return (
    <div
      data-variant={variant}
      className={cn(
        'deco-rings group/welcome @container min-h-[210px] rounded-card p-6 md:p-8',
        brand
          ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_-18px_var(--primary)] [--deco:var(--primary-foreground)]'
          : 'bg-[color-mix(in_srgb,var(--primary)_9%,var(--card))]',
        className
      )}
    >
      <div className="relative z-10 @[520px]:max-w-[58%]">
        <h2 className="text-xl leading-snug font-bold md:text-[1.4rem]">{title}</h2>
        {subtitle && (
          <p
            className={cn(
              'mt-1.5 text-sm leading-relaxed',
              brand ? 'text-primary-foreground/80' : 'text-foreground/65'
            )}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
      <img
        src="/assets/illustrations/illustration-dashboard.webp"
        alt=""
        className="absolute right-2 bottom-0 hidden w-[38%] max-w-[250px] [filter:hue-rotate(55deg)_drop-shadow(0_16px_24px_rgb(0_0_0/0.12))] @[520px]:block"
      />
    </div>
  );
}
