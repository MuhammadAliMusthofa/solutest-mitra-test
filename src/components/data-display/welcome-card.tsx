/* eslint-disable @next/next/no-img-element -- ilustrasi dekoratif statis */

import type { ReactNode } from 'react';

import { cn } from 'src/lib/utils';

interface Props {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Kartu sapaan ala Spike dengan ilustrasi di kanan bawah (disembunyikan bila kartu sempit). */
export function WelcomeCard({ title, subtitle, children, className }: Props) {
  return (
    <div
      className={cn(
        '@container relative min-h-[196px] overflow-hidden rounded-card bg-card p-6 shadow-card md:p-7',
        className
      )}
    >
      <div className="absolute -top-16 -right-16 size-56 rounded-full bg-primary/6" />
      <div className="relative z-10 @[520px]:max-w-[58%]">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
      <img
        src="/assets/illustrations/illustration-dashboard.webp"
        alt=""
        className="absolute -right-2 -bottom-2 hidden w-[40%] max-w-[240px] [filter:hue-rotate(55deg)] @[520px]:block"
      />
    </div>
  );
}
