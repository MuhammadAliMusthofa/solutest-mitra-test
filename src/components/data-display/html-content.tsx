'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

import { useHydrated } from 'src/hooks/use-hydrated';

import { cn } from 'src/lib/utils';

interface Props {
  html?: string | null;
  className?: string;
  /** tag pembungkus */
  as?: 'div' | 'span';
}

const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Render HTML soal/pembahasan dari editor setelah disanitasi DOMPurify.
 * Sebelum mount (SSR/prerender) hanya teks polos yang tampil — tanpa HTML mentah.
 */
export function HtmlContent({ html, className, as: Tag = 'div' }: Props) {
  const mounted = useHydrated();

  const clean = useMemo(
    () =>
      mounted && html
        ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, ADD_ATTR: ['target'] })
        : '',
    [html, mounted]
  );

  if (!html) return null;
  if (!mounted) return <Tag className={cn('rich-content', className)}>{stripTags(html)}</Tag>;

  return (
    <Tag className={cn('rich-content', className)} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}

/** Teks polos dari HTML (ringkasan/preview). */
export const htmlToText = stripTags;
