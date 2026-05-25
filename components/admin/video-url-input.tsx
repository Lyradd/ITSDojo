'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VideoUrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Detects video source type from a raw URL and returns an embed URL.
 */
function parseVideoUrl(url: string): { embedUrl: string; source: string } | null {
  if (!url || !url.trim()) return null;

  const trimmed = url.trim();

  // Already an embed URL (YouTube)
  if (trimmed.includes('youtube.com/embed/')) {
    return { embedUrl: trimmed, source: 'YouTube' };
  }

  // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (ytWatchMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytWatchMatch[1]}`, source: 'YouTube' };
  }

  // YouTube short URL: https://youtu.be/VIDEO_ID
  const ytShortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytShortMatch) {
    return { embedUrl: `https://www.youtube.com/embed/${ytShortMatch[1]}`, source: 'YouTube' };
  }

  // Google Drive file URL: https://drive.google.com/file/d/FILE_ID/view
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return { embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`, source: 'Google Drive' };
  }

  // Google Drive open URL: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return { embedUrl: `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`, source: 'Google Drive' };
  }

  // Already a Google Drive preview/embed URL
  if (trimmed.includes('drive.google.com/file/d/') && trimmed.includes('/preview')) {
    return { embedUrl: trimmed, source: 'Google Drive' };
  }

  // Generic URL — just return as-is
  if (trimmed.startsWith('http')) {
    return { embedUrl: trimmed, source: 'URL Langsung' };
  }

  return null;
}

export default function VideoUrlInput({ value, onChange }: VideoUrlInputProps) {
  const [rawUrl, setRawUrl] = useState(value);
  const [parsed, setParsed] = useState<{ embedUrl: string; source: string } | null>(null);

  // Sync rawUrl with the external value prop
  useEffect(() => {
    setRawUrl(value);
  }, [value]);

  // Debounced parsing
  useEffect(() => {
    const result = parseVideoUrl(rawUrl);
    setParsed(result);
  }, [rawUrl]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setRawUrl(newUrl);

    // Auto-convert to embed URL when saving
    const result = parseVideoUrl(newUrl);
    if (result) {
      onChange(result.embedUrl);
    } else {
      onChange(newUrl);
    }
  }, [onChange]);

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Video className="w-4 h-4" />
        Video URL
      </Label>

      <div className="space-y-2">
        <Input
          value={rawUrl}
          onChange={handleChange}
          className="h-11"
          placeholder="Tempel link YouTube atau Google Drive di sini..."
        />

        {/* Source detection indicator */}
        {rawUrl && (
          <div className="flex items-center gap-2 text-xs">
            {parsed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Terdeteksi: {parsed.source}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">
                  Format URL tidak dikenali
                </span>
              </>
            )}
          </div>
        )}

        {/* Supported formats hint */}
        <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">youtube.com/watch?v=...</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">youtu.be/...</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">drive.google.com/file/d/.../view</span>
        </div>
      </div>

      {/* Live Preview */}
      {parsed && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Preview</span>
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Buka Link
            </a>
          </div>
          <div className="rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-black aspect-video">
            <iframe
              src={parsed.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
