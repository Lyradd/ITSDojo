'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, File, X, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MaterialFile {
  url: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

interface MaterialUploadProps {
  /** Current list of material URLs (stored as JSON string in summaryContent) */
  materials: MaterialFile[];
  onMaterialsChange: (materials: MaterialFile[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (ext === 'doc' || ext === 'docx') return <File className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-zinc-500" />;
}

export default function MaterialUpload({ materials, onMaterialsChange }: MaterialUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    const uploadPromises = Array.from(files).map(async (file) => {
      // Validasi ukuran file (Max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar (Maksimal 20MB)`);
        return null;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload/material', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            url: data.url,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType,
          };
        } else {
          const err = await res.json();
          toast.error(`Gagal upload ${file.name}: ${err.error || 'Unknown error'}`);
          return null;
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Gagal upload ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean) as MaterialFile[];

    if (successfulUploads.length > 0) {
      onMaterialsChange([...materials, ...successfulUploads]);
      
      if (successfulUploads.length === files.length) {
        toast.success(`${successfulUploads.length} file berhasil diunggah!`);
      } else {
        toast.success(`${successfulUploads.length} dari ${files.length} file berhasil diunggah.`);
      }
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index);
    onMaterialsChange(newMaterials);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 bg-zinc-50/50 dark:bg-zinc-950/30'
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Mengupload file...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-zinc-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Klik atau seret file ke sini
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                PDF, DOC, DOCX • Maks 20MB
              </p>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded files list */}
      {materials.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            File Terlampir ({materials.length})
          </p>
          {materials.map((mat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group"
            >
              {getFileIcon(mat.fileName)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {mat.fileName}
                </p>
                {mat.fileSize && (
                  <p className="text-xs text-zinc-400">{formatFileSize(mat.fileSize)}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                  title="Lihat file"
                  onClick={(e) => e.stopPropagation()}
                >
                  {mat.fileName.endsWith('.pdf') ? <Eye className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                  title="Hapus file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
