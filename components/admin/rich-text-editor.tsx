'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
      Memuat editor...
    </div>
  ),
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'indent',
    'blockquote', 'code-block',
    'link', 'image',
    'color', 'background',
    'align',
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Tulis rangkuman materi di sini...'}
      />

      <style jsx global>{`
        .rich-text-editor .ql-toolbar.ql-snow {
          border: 1px solid rgb(228 228 231);
          border-radius: 0.75rem 0.75rem 0 0;
          background: rgb(250 250 250);
        }
        .rich-text-editor .ql-container.ql-snow {
          border: 1px solid rgb(228 228 231);
          border-top: 0;
          border-radius: 0 0 0.75rem 0.75rem;
          min-height: 200px;
          font-size: 14px;
          background: white;
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
          line-height: 1.6;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(161 161 170);
          font-style: normal;
        }

        /* Dark mode */
        .dark .rich-text-editor .ql-toolbar.ql-snow {
          border-color: rgb(63 63 70);
          background: rgb(24 24 27);
        }
        .dark .rich-text-editor .ql-container.ql-snow {
          border-color: rgb(63 63 70);
          background: rgb(9 9 11);
          color: rgb(244 244 245);
        }
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(113 113 122);
        }
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: rgb(161 161 170);
        }
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: rgb(161 161 170);
        }
        .dark .rich-text-editor .ql-toolbar .ql-picker-label {
          color: rgb(161 161 170);
        }
        .dark .rich-text-editor .ql-toolbar .ql-picker-options {
          background: rgb(39 39 42);
          border-color: rgb(63 63 70);
        }
        .dark .rich-text-editor .ql-toolbar .ql-picker-item {
          color: rgb(212 212 216);
        }
        .dark .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: rgb(96 165 250);
        }
        .dark .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .dark .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: rgb(96 165 250);
        }
        .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover,
        .dark .rich-text-editor .ql-toolbar .ql-picker-label.ql-active {
          color: rgb(96 165 250);
        }
        .dark .rich-text-editor .ql-snow a {
          color: rgb(96 165 250);
        }

        /* Code block styling */
        .rich-text-editor .ql-snow .ql-editor pre.ql-syntax {
          background: rgb(39 39 42);
          color: rgb(212 212 216);
          border-radius: 0.5rem;
          padding: 1rem;
          font-family: 'Fira Code', 'Cascadia Code', monospace;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
