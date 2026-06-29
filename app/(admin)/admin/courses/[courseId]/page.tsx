"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  BookOpen,
  ArrowLeft,
  Video,
  FileText,
  Code,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Paperclip,
  UserPlus,
  Trash2,
  ExternalLink,
  Eye,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface MaterialFile {
  url: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

function parseVideoUrl(url: string): { embedUrl: string; source: string } | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/embed/')) return { embedUrl: trimmed, source: 'YouTube' };
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (ytWatchMatch) return { embedUrl: `https://www.youtube.com/embed/${ytWatchMatch[1]}`, source: 'YouTube' };
  const ytShortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytShortMatch) return { embedUrl: `https://www.youtube.com/embed/${ytShortMatch[1]}`, source: 'YouTube' };
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) return { embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`, source: 'Google Drive' };
  if (trimmed.includes('drive.google.com/file/d/') && trimmed.includes('/preview')) return { embedUrl: trimmed, source: 'Google Drive' };
  if (trimmed.startsWith('http')) return { embedUrl: trimmed, source: 'URL Langsung' };
  return null;
}

export default function CourseDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { role } = useUserStore();

  useEffect(() => {
    if (role === 'dosen') {
      router.push(`/dosen/courses/${courseId}`);
    }
  }, [role, courseId, router]);

  const [course, setCourse] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment states
  const [allDosen, setAllDosen] = useState<any[]>([]);
  const [assignedDosen, setAssignedDosen] = useState<any[]>([]);
  const [selectedDosenId, setSelectedDosenId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Lesson preview modal
  const [previewLesson, setPreviewLesson] = useState<any>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, unitsRes, usersRes, assignRes] = await Promise.all([
        fetch('/api/courses'),
        fetch(`/api/courses/${courseId}/units`),
        fetch('/api/admin/users'),
        fetch('/api/admin/assignments'),
      ]);
      
      const allCourses = await coursesRes.json();
      const unitsData = await unitsRes.json();
      const allUsers = await usersRes.json();
      const assignData = await assignRes.json();

      setCourse(allCourses.find((c: any) => c.id === courseId) || null);
      setUnits(unitsData);

      // Filter all available Dosen users
      const dosenUsers = (Array.isArray(allUsers) ? allUsers : []).filter((u: any) => u.role === 'dosen');
      setAllDosen(dosenUsers);

      // Filter assigned instructors for this specific course
      if (assignData && !assignData.error) {
        const assigned = (assignData.instructors || []).filter((i: any) => i.courseId === courseId);
        setAssignedDosen(assigned);
      }
    } catch (err) {
      console.error('Failed to fetch admin course data:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Assign Dosen
  const handleAssignDosen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDosenId) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedDosenId,
          courseId: courseId,
          type: 'instructor'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menugaskan dosen');

      toast.success('Dosen berhasil ditugaskan ke kelas ini!');
      setSelectedDosenId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setAssigning(false);
    }
  };

  // Handle Unassign Dosen
  const handleUnassignDosen = async (assignmentId: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan penugasan dosen ini?')) return;
    try {
      const res = await fetch(`/api/admin/assignments?type=instructor&id=${assignmentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal membatalkan penugasan');
      
      toast.success('Penugasan dosen dibatalkan.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-zinc-500">Course tidak ditemukan</p>
        <Link href="/admin/courses">
          <Button className="mt-4">Kembali ke Courses</Button>
        </Link>
      </div>
    );
  }

  // Filter available Dosen options to assign (dosen who are not already assigned to this course)
  const availableDosen = allDosen.filter(d => !assignedDosen.some(ad => ad.userId === d.id));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Toaster position="top-center" />
      
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Back Link */}
        <Link href="/admin/courses">
          <Button variant="ghost" className="mb-6 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Kelas
          </Button>
        </Link>

        {/* Header Section */}
        <div className="mb-8 relative p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                  {course.difficulty}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  {course.xpReward} XP Reward
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-2 tracking-tight">
                {course.title}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                {course.description}
              </p>
            </div>
          </div>
        </div>

        {/* Grid Layout: Main Course Content & Lecturer Assignment Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Course Structure (Read-only) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Struktur Pembelajaran
              </h2>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {units.length} Unit
              </span>
            </div>

            {units.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl border-2 bg-white/80 dark:bg-zinc-900/80">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                <p className="text-zinc-500">Materi belum disusun oleh dosen pengampu.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {units.map((unit: any) => (
                  <Card key={unit.id} className="p-6 rounded-2xl border bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <h3 className="text-lg font-extrabold text-zinc-800 dark:text-zinc-100">{unit.title}</h3>
                      <p className="text-sm text-zinc-500">{unit.description}</p>
                    </div>

                    {/* Lessons list inside Unit */}
                    <div className="space-y-2.5">
                      {(unit.lessons && unit.lessons.length > 0) ? (
                        unit.lessons.map((lesson: any, idx: number) => (
                          <div
                            key={lesson.id}
                            onClick={() => setPreviewLesson(lesson)}
                            className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-700 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold text-sm text-zinc-500">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {lesson.title}
                              </div>
                              <div className="flex items-center flex-wrap gap-3 text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                {lesson.duration && <span>⏱ {lesson.duration}</span>}
                                <span>💎 {lesson.xpReward} XP</span>
                                <span>💠 {lesson.gemReward} Gems</span>
                                {lesson.videoUrl && <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">📹 Video</span>}
                                {lesson.starterCode && <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-medium">💻 Coding</span>}
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                              <Eye className="w-4 h-4 text-zinc-500" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic p-3 text-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl">
                          Belum ada lesson pada unit ini.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Assignment Panel (Assign Dosen) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-purple-600" />
              Dosen Pengampu
            </h2>

            {/* Form to Assign Dosen */}
            <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm">
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                Tugaskan Dosen Baru
              </h3>
              
              <form onSubmit={handleAssignDosen} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dosenSelect">Pilih Dosen</Label>
                  <select
                    id="dosenSelect"
                    value={selectedDosenId}
                    onChange={(e) => setSelectedDosenId(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Dosen --</option>
                    {availableDosen.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={assigning || !selectedDosenId}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 rounded-xl shadow-md transition-all"
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Tugaskan Kelas
                </Button>
              </form>
            </Card>

            {/* List of Assigned Dosen */}
            <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm">
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                Daftar Dosen Pengampu ({assignedDosen.length})
              </h3>

              {assignedDosen.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-sm">
                  Belum ada dosen yang ditugaskan ke kelas ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedDosen.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {assignment.userName}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {assignment.userEmail}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUnassignDosen(assignment.id)}
                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Hapus Penugasan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Read-only Lesson Preview Dialog */}
        <AnimatePresence>
          {previewLesson && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={() => setPreviewLesson(null)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-3xl border shadow-2xl z-[101] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded">
                      Detail Lesson
                    </span>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                      {previewLesson.title}
                    </h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPreviewLesson(null)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Modal Content Scroll Area */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-130px)]">
                  {/* Summary / Description */}
                  {previewLesson.description && (
                    <div className="space-y-1">
                      <Label className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold">Deskripsi</Label>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {previewLesson.description}
                      </p>
                    </div>
                  )}

                  {/* Video Embed */}
                  {previewLesson.videoUrl && (() => {
                    const videoParsed = parseVideoUrl(previewLesson.videoUrl);
                    if (!videoParsed) return null;
                    return (
                      <div className="space-y-2">
                        <Label className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold">Video Pembelajaran</Label>
                        <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-2xl border-2 border-zinc-200 dark:border-zinc-800">
                          <iframe
                            src={videoParsed.embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary Content (HTML) */}
                  {previewLesson.summaryContent && (
                    <div className="space-y-2 border-t pt-4 border-zinc-100 dark:border-zinc-800/80">
                      <Label className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold">Rangkuman Materi</Label>
                      <div
                        className="prose dark:prose-invert max-w-none text-sm leading-relaxed border p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20"
                        dangerouslySetInnerHTML={{ __html: previewLesson.summaryContent }}
                      />
                    </div>
                  )}

                  {/* File Attachments */}
                  {previewLesson.materialFiles && (() => {
                    let files: MaterialFile[] = [];
                    try {
                      files = JSON.parse(previewLesson.materialFiles);
                    } catch { files = []; }
                    if (files.length === 0) return null;
                    return (
                      <div className="space-y-2 border-t pt-4 border-zinc-100 dark:border-zinc-800/80">
                        <Label className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold">File Lampiran</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {files.map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            >
                              <Paperclip className="w-5 h-5 text-blue-500 shrink-0" />
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                  {file.fileName}
                                </p>
                                <p className="text-xs text-zinc-400">Lampiran Materi</p>
                              </div>
                              <Download className="w-4 h-4 text-zinc-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Coding Problem */}
                  {previewLesson.problemTitle && (
                    <div className="space-y-4 border-t pt-4 border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-zinc-800 dark:text-zinc-200">Soal Coding Practice</h3>
                      </div>
                      <div className="p-5 border rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
                        <div>
                          <Label className="text-[10px] text-zinc-400 uppercase font-bold">Judul Soal</Label>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">{previewLesson.problemTitle}</p>
                        </div>
                        {previewLesson.problemDescription && (
                          <div>
                            <Label className="text-[10px] text-zinc-400 uppercase font-bold">Deskripsi Soal</Label>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{previewLesson.problemDescription}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {previewLesson.sampleInput && (
                            <div>
                              <Label className="text-[10px] text-zinc-400 uppercase font-bold">Sample Input</Label>
                              <pre className="p-3 bg-zinc-100 dark:bg-zinc-850 rounded-lg text-xs font-mono whitespace-pre-wrap mt-1">
                                {previewLesson.sampleInput}
                              </pre>
                            </div>
                          )}
                          {previewLesson.sampleOutput && (
                            <div>
                              <Label className="text-[10px] text-zinc-400 uppercase font-bold">Sample Output</Label>
                              <pre className="p-3 bg-zinc-100 dark:bg-zinc-850 rounded-lg text-xs font-mono whitespace-pre-wrap mt-1">
                                {previewLesson.sampleOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
