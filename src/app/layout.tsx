import './globals.css';

import type { Metadata, Viewport } from 'next';

import { Suspense } from 'react';
import { Poppins } from 'next/font/google';

import { ENV } from 'src/config/env';

import { PageLoader } from 'src/components/feedback/page-loader';
import { AppProviders } from 'src/components/providers/app-providers';
import { THEME_BOOT_SCRIPT } from 'src/components/providers/theme-sync';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: ENV.appName, template: `%s · ${ENV.appName}` },
  description:
    'Platform tryout, bank soal, dan analitik hasil belajar untuk lembaga mitra Solutest.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#3F479E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/* Pasang tema mitra terakhir sebelum render pertama (anti-kedip). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <AppProviders>
          <Suspense fallback={<PageLoader fullscreen />}>{children}</Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
