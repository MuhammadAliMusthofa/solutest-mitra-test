'use client';

import type { Editor } from '@tiptap/react';

import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** tinggi minimum area tulis */
  minHeight?: number;
  invalid?: boolean;
  id?: string;
  'aria-label'?: string;
}

const isEmptyHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim() === '';

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const buttons = [
    {
      icon: 'solar:text-bold-linear',
      label: 'Tebal',
      active: state.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: 'solar:text-italic-linear',
      label: 'Miring',
      active: state.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: 'solar:text-underline-linear',
      label: 'Garis bawah',
      active: state.underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: 'solar:list-linear',
      label: 'Daftar berpoin',
      active: state.bullet,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: 'solar:list-arrow-down-linear',
      label: 'Daftar bernomor',
      active: state.ordered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: 'solar:chat-square-linear',
      label: 'Kutipan',
      active: state.quote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5"
      role="toolbar"
      aria-label="Format teks"
    >
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.label}
          aria-label={b.label}
          aria-pressed={b.active}
          onClick={b.run}
          className={cn(
            'grid size-8 place-items-center rounded-lg text-foreground/60 transition-colors hover:bg-card hover:text-primary hover:shadow-card',
            b.active &&
              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
          )}
        >
          <Iconify icon={b.icon} size={17} />
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        title="Urungkan"
        aria-label="Urungkan"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
        className="grid size-8 place-items-center rounded-lg text-foreground/60 transition-colors hover:bg-card hover:text-primary disabled:opacity-40"
      >
        <Iconify icon="solar:undo-left-linear" size={17} />
      </button>
      <button
        type="button"
        title="Ulangi"
        aria-label="Ulangi"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
        className="grid size-8 place-items-center rounded-lg text-foreground/60 transition-colors hover:bg-card hover:text-primary disabled:opacity-40"
      >
        <Iconify icon="solar:undo-right-linear" size={17} />
      </button>
    </div>
  );
}

/** Editor teks kaya (Tiptap) untuk soal, opsi, stimulus, dan pembahasan. Keluaran: HTML. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 120,
  invalid,
  id,
  ...rest
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Tulis di sini…' }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'rich-content px-4 py-3 text-sm',
        style: `min-height:${minHeight}px`,
        ...(id ? { id } : {}),
        'aria-label': rest['aria-label'] ?? placeholder ?? 'Editor teks',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(isEmptyHtml(html) ? '' : html);
    },
  });

  // sinkronkan nilai eksternal (mis. form di-reset / data dimuat)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') !== (isEmptyHtml(current) ? '' : current)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-input bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12 hover:border-[color-mix(in_oklab,var(--input),var(--foreground)_18%)]',
        invalid && 'border-destructive'
      )}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-10 border-b border-border" />}
      <EditorContent editor={editor} />
    </div>
  );
}
