"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  Video,
  FileText,
  Code,
  GripVertical,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Paperclip
} from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import VideoUrlInput from '@/components/admin/video-url-input';
import MaterialUpload from '@/components/admin/material-upload';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor'), { ssr: false });

interface TestCaseForm {
  stdin: string;
  expected: string;
  hidden: boolean;
}

interface MaterialFile {
  url: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

interface LessonForm {
  title: string;
  order: number;
  description: string;
  duration: string;
  xpReward: number;
  gemReward: number;
  videoUrl: string;
  summaryContent: string;
  materialFiles: MaterialFile[];
  problemTitle: string;
  problemDescription: string;
  problemCategory: string;
  starterCode: string;
  defaultLanguage: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: TestCaseForm[];
}

const EMPTY_LESSON: LessonForm = {
  title: '', order: 1, description: '', duration: '',
  xpReward: 50, gemReward: 10, videoUrl: '', summaryContent: '',
  materialFiles: [],
  problemTitle: '', problemDescription: '', problemCategory: '',
  starterCode: '', defaultLanguage: 'c', sampleInput: '', sampleOutput: '',
  testCases: [{ stdin: '', expected: '', hidden: false }],
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ title: '', description: '', order: 1 });

  const [showAddLesson, setShowAddLesson] = useState<number | null>(null); // unitId
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>({ ...EMPTY_LESSON });
  const [expandedSection, setExpandedSection] = useState<string>('basic');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteUnitConfirmId, setDeleteUnitConfirmId] = useState<number | null>(null);

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseEditForm, setCourseEditForm] = useState({ title: '', description: '' });

  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [unitEditForm, setUnitEditForm] = useState({ title: '', description: '', order: 1 });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, unitsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch(`/api/courses/${courseId}/units`),
      ]);
      const allCourses = await coursesRes.json();
      const unitsData = await unitsRes.json();
      setCourse(allCourses.find((c: any) => c.id === courseId) || null);
      setUnits(unitsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- UNIT CRUD ---
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dosen' },
        body: JSON.stringify({ ...unitForm, courseId }),
      });
      if (!res.ok) { const err = await res.json(); alert(`Gagal: ${err.error}`); return; }
      setShowAddUnit(false);
      setUnitForm({ title: '', description: '', order: units.length + 1 });
      await fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseEditForm.title,
          description: courseEditForm.description,
          difficulty: course.difficulty,
          xpReward: course.xpReward,
          color: course.color
        }),
      });
      if (res.ok) {
        setIsEditingCourse(false);
        await fetchData();
      } else {
        alert("Gagal memperbarui info kelas");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent, unitId: number) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/units/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dosen'
        },
        body: JSON.stringify(unitEditForm),
      });
      if (res.ok) {
        setEditingUnitId(null);
        await fetchData();
      } else {
        alert("Gagal memperbarui unit");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const startEditUnit = (unit: any) => {
    setUnitEditForm({
      title: unit.title,
      description: unit.description,
      order: unit.order || 1
    });
    setEditingUnitId(unit.id);
  };

  // --- LESSON CRUD ---
  const handleSaveLesson = async (e: React.FormEvent, unitId: number) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingLessonId
        ? `/api/admin/lessons/${editingLessonId}`
        : '/api/admin/lessons';
      const method = editingLessonId ? 'PUT' : 'POST';

      const durationNum = lessonForm.duration ? lessonForm.duration.replace(/\D/g, '') : '';
      const formattedDuration = durationNum ? `${durationNum} menit` : '';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dosen' },
        body: JSON.stringify({
          ...lessonForm,
          duration: formattedDuration,
          materialFiles: JSON.stringify(lessonForm.materialFiles),
          unitId
        }),
      });
      if (!res.ok) { const err = await res.json(); alert(`Gagal: ${err.error}`); return; }

      setShowAddLesson(null);
      setEditingLessonId(null);
      setLessonForm({ ...EMPTY_LESSON });
      await fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    setDeleteConfirmId(lessonId);
  };

  const handleConfirmDeleteLesson = async () => {
    if (deleteConfirmId === null) return;
    try {
      await fetch(`/api/admin/lessons/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'dosen' },
      });
      await fetchData();
    } catch (err) { console.error(err); }
    setDeleteConfirmId(null);
  };

  const handleDeleteUnit = async (unitId: number) => {
    setDeleteUnitConfirmId(unitId);
  };

  const handleConfirmDeleteUnit = async () => {
    if (deleteUnitConfirmId === null) return;
    try {
      const res = await fetch(`/api/admin/units/${deleteUnitConfirmId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'dosen' },
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert("Gagal menghapus unit");
      }
    } catch (err) { console.error(err); }
    setDeleteUnitConfirmId(null);
  };

  const handleEditLesson = async (lesson: any) => {
    if (editingLessonId === lesson.id) {
      setEditingLessonId(null);
      setShowAddLesson(null);
      setLessonForm({ ...EMPTY_LESSON });
      return;
    }
    // Fetch full lesson data with test cases
    const res = await fetch(`/api/lessons/${lesson.id}`);
    const full = await res.json();

    // Parse materialFiles from JSON string
    let parsedMaterials: MaterialFile[] = [];
    try {
      if (full.materialFiles) {
        parsedMaterials = JSON.parse(full.materialFiles);
      }
    } catch { parsedMaterials = []; }

    setLessonForm({
      title: full.title || '',
      order: full.order || 1,
      description: full.description || '',
      duration: full.duration || '',
      xpReward: full.xpReward || 50,
      gemReward: full.gemReward || 10,
      videoUrl: full.videoUrl || '',
      summaryContent: full.summaryContent || '',
      materialFiles: parsedMaterials,
      problemTitle: full.problemTitle || '',
      problemDescription: full.problemDescription || '',
      problemCategory: full.problemCategory || '',
      starterCode: full.starterCode || '',
      defaultLanguage: full.defaultLanguage || 'c',
      sampleInput: full.sampleInput || '',
      sampleOutput: full.sampleOutput || '',
      testCases: full.testCases?.length > 0
        ? full.testCases.map((tc: any) => ({ stdin: tc.stdin, expected: tc.expected, hidden: tc.hidden }))
        : [{ stdin: '', expected: '', hidden: false }],
    });
    setEditingLessonId(lesson.id);
    setShowAddLesson(lesson.unitId);
  };

  // --- TEST CASE HELPERS ---
  const addTestCase = () => {
    setLessonForm(prev => ({
      ...prev,
      testCases: [...prev.testCases, { stdin: '', expected: '', hidden: false }],
    }));
  };
  const removeTestCase = (idx: number) => {
    setLessonForm(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== idx),
    }));
  };
  const updateTestCase = (idx: number, field: keyof TestCaseForm, value: any) => {
    setLessonForm(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => i === idx ? { ...tc, [field]: value } : tc),
    }));
  };

  const renderLessonForm = (unitId: number) => (
    <Card className="p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 my-4">
      <h4 className="text-lg font-bold mb-4">
        {editingLessonId ? '✏️ Edit Lesson' : '➕ Tambah Lesson Baru'}
      </h4>
      <form onSubmit={(e) => handleSaveLesson(e, unitId)} className="space-y-4">

        {/* Section: Basic Info */}
        <SectionToggle id="basic" label="Informasi Dasar" icon={FileText} />
        <AnimatePresence initial={false}>
          {expandedSection === 'basic' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-4 pl-2 border-l-4 border-blue-200 dark:border-blue-800 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Lesson *</Label>
                  <Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} required className="h-11" placeholder="Playing With Characters" />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Singkat</Label>
                  <Input value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} className="h-11" placeholder="Tag & Element Dasar" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Durasi</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={lessonForm.duration ? lessonForm.duration.replace(/\D/g, '') : ''}
                      onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })}
                      className="h-11 pr-16"
                      placeholder="15"
                      min="1"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium pointer-events-none select-none">
                      menit
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Urutan</Label>
                  <Input type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })} className="h-11" min="1" />
                </div>
                <div className="space-y-2">
                  <Label>XP Reward</Label>
                  <Input type="number" value={lessonForm.xpReward} onChange={e => setLessonForm({ ...lessonForm, xpReward: parseInt(e.target.value) })} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Gem Reward</Label>
                  <Input type="number" value={lessonForm.gemReward} onChange={e => setLessonForm({ ...lessonForm, gemReward: parseInt(e.target.value) })} className="h-11" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Video & Rangkuman */}
        <SectionToggle id="content" label="Video & Rangkuman" icon={Video} />
        <AnimatePresence initial={false}>
          {expandedSection === 'content' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-6 pl-2 border-l-4 border-green-200 dark:border-green-800 pt-2"
            >
              {/* Video URL with smart detection */}
              <VideoUrlInput
                value={lessonForm.videoUrl}
                onChange={(val) => setLessonForm({ ...lessonForm, videoUrl: val })}
              />

              {/* Rich Text Editor for summary */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Rangkuman Materi
                </Label>
                <RichTextEditor
                  value={lessonForm.summaryContent}
                  onChange={(val) => setLessonForm({ ...lessonForm, summaryContent: val })}
                  placeholder="Tulis rangkuman materi di sini..."
                />
              </div>

              {/* File Upload for PDF/DOCX */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Lampiran Materi (PDF/DOCX)
                </Label>
                <MaterialUpload
                  materials={lessonForm.materialFiles}
                  onMaterialsChange={(mats) => setLessonForm({ ...lessonForm, materialFiles: mats })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Coding Problem */}
        <SectionToggle id="coding" label="Soal Coding (Practice)" icon={Code} />
        <AnimatePresence initial={false}>
          {expandedSection === 'coding' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-4 pl-2 border-l-4 border-purple-200 dark:border-purple-800 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Soal</Label>
                  <Input value={lessonForm.problemTitle} onChange={e => setLessonForm({ ...lessonForm, problemTitle: e.target.value })} className="h-11" placeholder="Playing With Characters" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Input value={lessonForm.problemCategory} onChange={e => setLessonForm({ ...lessonForm, problemCategory: e.target.value })} className="h-11" placeholder="Materi Dasar" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Soal</Label>
                <Textarea value={lessonForm.problemDescription} onChange={e => setLessonForm({ ...lessonForm, problemDescription: e.target.value })} rows={4} placeholder="This challenge will help you..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bahasa Default</Label>
                  <select value={lessonForm.defaultLanguage} onChange={e => setLessonForm({ ...lessonForm, defaultLanguage: e.target.value })} className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="python">Python</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Starter Code</Label>
                <Textarea value={lessonForm.starterCode} onChange={e => setLessonForm({ ...lessonForm, starterCode: e.target.value })} rows={8} className="font-mono text-sm" placeholder='#include <stdio.h>\n\nint main() {\n    return 0;\n}' />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sample Input</Label>
                  <Textarea value={lessonForm.sampleInput} onChange={e => setLessonForm({ ...lessonForm, sampleInput: e.target.value })} rows={3} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Sample Output</Label>
                  <Textarea value={lessonForm.sampleOutput} onChange={e => setLessonForm({ ...lessonForm, sampleOutput: e.target.value })} rows={3} className="font-mono text-sm" />
                </div>
              </div>

              {/* Test Cases */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Test Cases</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addTestCase}>
                    <Plus className="w-3 h-3 mr-1" /> Tambah
                  </Button>
                </div>
                {lessonForm.testCases.map((tc, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-start p-3 bg-white dark:bg-zinc-900 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-xs">Input (stdin)</Label>
                      <Textarea value={tc.stdin} onChange={e => updateTestCase(idx, 'stdin', e.target.value)} rows={2} className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Expected Output</Label>
                      <Textarea value={tc.expected} onChange={e => updateTestCase(idx, 'expected', e.target.value)} rows={2} className="font-mono text-xs" />
                    </div>
                    <div className="flex flex-col items-center gap-1 pt-5">
                      <Label className="text-xs">Hidden</Label>
                      <input type="checkbox" checked={tc.hidden} onChange={e => updateTestCase(idx, 'hidden', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="mt-5" onClick={() => removeTestCase(idx)} disabled={lessonForm.testCases.length <= 1}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-bold">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {editingLessonId ? 'Update Lesson' : 'Simpan Lesson'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setShowAddLesson(null); setEditingLessonId(null); setLessonForm({ ...EMPTY_LESSON }); }}>
            Batal
          </Button>
        </div>
      </form>
    </Card>
  );

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-zinc-500">Course not found</p>
        <Link href="/dosen/courses">
          <Button className="mt-4">Kembali ke Daftar Kelas</Button>
        </Link>
      </div>
    );
  }

  const SectionToggle = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
      className="flex items-center justify-between w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
    >
      <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{label}</span>
      {expandedSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dosen/courses">
            <Button variant="ghost" className="mb-4 hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Kelas
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              {isEditingCourse ? (
                <form onSubmit={handleUpdateCourse} className="space-y-4 max-w-xl bg-white dark:bg-zinc-900 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <Label>Nama Kelas *</Label>
                    <Input value={courseEditForm.title} onChange={e => setCourseEditForm({ ...courseEditForm, title: e.target.value })} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi Kelas</Label>
                    <Textarea value={courseEditForm.description} onChange={e => setCourseEditForm({ ...courseEditForm, description: e.target.value })} rows={3} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      Simpan
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsEditingCourse(false)}>
                      Batal
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2 group">
                    <BookOpen className="w-8 h-8 text-blue-600 animate-pulse" />
                    <h1 className="text-3xl font-bold text-blue-700 dark:text-white">
                      {course.title}
                    </h1>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      onClick={() => {
                        setCourseEditForm({ title: course.title, description: course.description || '' });
                        setIsEditingCourse(true);
                      }}
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">{course.description}</p>
                </div>
              )}
            </div>
            <Button onClick={() => { setShowAddUnit(!showAddUnit); }} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-bold shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Unit
            </Button>
          </div>
        </div>

        {/* Add Unit Form */}
        {showAddUnit && (
          <Card className="p-6 rounded-2xl border-2 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4">Buat Unit Baru</h3>
            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Judul Unit *</Label>
                  <Input value={unitForm.title} onChange={e => setUnitForm({ ...unitForm, title: e.target.value })} required className="h-11" placeholder="Unit 1: Pendahuluan" />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi *</Label>
                  <Input value={unitForm.description} onChange={e => setUnitForm({ ...unitForm, description: e.target.value })} required className="h-11" placeholder="Konsep dasar pemrograman" />
                </div>
                <div className="space-y-2">
                  <Label>Urutan</Label>
                  <Input type="number" value={unitForm.order} onChange={e => setUnitForm({ ...unitForm, order: parseInt(e.target.value) })} className="h-11" min="1" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-bold">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Unit
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddUnit(false)}>Batal</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Units & Lessons */}
        {units.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border-2 bg-white/80 dark:bg-zinc-900/80">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 mb-4">Belum ada unit. Mulai dengan membuat unit pertama!</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {units.map((unit: any) => (
              <Card key={unit.id} className="p-6 rounded-2xl border-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  {editingUnitId === unit.id ? (
                    <form onSubmit={(e) => handleUpdateUnit(e, unit.id)} className="flex-1 space-y-3 mr-4 p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Judul Unit *</Label>
                          <Input value={unitEditForm.title} onChange={e => setUnitEditForm({ ...unitEditForm, title: e.target.value })} required className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Deskripsi *</Label>
                          <Input value={unitEditForm.description} onChange={e => setUnitEditForm({ ...unitEditForm, description: e.target.value })} required className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Urutan</Label>
                          <Input type="number" value={unitEditForm.order} onChange={e => setUnitEditForm({ ...unitEditForm, order: parseInt(e.target.value) })} className="h-9" min="1" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 text-xs rounded-md">
                          Simpan
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="h-8 px-3 text-xs rounded-md" onClick={() => setEditingUnitId(null)}>
                          Batal
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex-1 group flex items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{unit.title}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                            onClick={() => startEditUnit(unit)}
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
                        </div>
                        <p className="text-sm text-zinc-500">{unit.description}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditUnit(unit)}
                      className="border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (showAddLesson === unit.id && !editingLessonId) {
                          setShowAddLesson(null);
                        } else {
                          setShowAddLesson(unit.id);
                          setEditingLessonId(null);
                          setLessonForm({ ...EMPTY_LESSON, order: (unit.lessons?.length || 0) + 1 });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-bold"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Lesson
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Lesson List */}
                <div className="space-y-2">
                  {(unit.lessons || []).map((lesson: any, idx: number) => (
                    <div key={lesson.id} className="space-y-2">
                      <div
                        onClick={() => handleEditLesson(lesson)}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-white dark:bg-zinc-900 group cursor-pointer select-none"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold text-sm text-zinc-500">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{lesson.title}</div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            {lesson.duration && <span>⏱ {lesson.duration}</span>}
                            <span>💎 {lesson.xpReward} XP</span>
                            <span>💠 {lesson.gemReward} Gems</span>
                            {lesson.videoUrl && <span className="text-blue-500">📹 Video</span>}
                            {lesson.starterCode && <span className="text-purple-500">💻 Coding</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEditLesson(lesson); }}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      {/* Inline Form if editing this specific lesson */}
                      <AnimatePresence initial={false}>
                        {editingLessonId === lesson.id && showAddLesson === unit.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="pl-4 border-l-2 border-blue-500 my-2 overflow-hidden"
                          >
                            {renderLessonForm(unit.id)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Inline Form if adding a new lesson at the bottom of the unit */}
                  <AnimatePresence initial={false}>
                    {showAddLesson === unit.id && !editingLessonId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="pl-4 border-l-2 border-green-500 my-2 overflow-hidden"
                      >
                        {renderLessonForm(unit.id)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDeleteLesson}
        title="Hapus Lesson?"
        message="Apakah Anda yakin ingin menghapus lesson ini? Seluruh data test cases yang berhubungan juga akan dihapus secara permanen."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
      <ConfirmModal
        isOpen={deleteUnitConfirmId !== null}
        onClose={() => setDeleteUnitConfirmId(null)}
        onConfirm={handleConfirmDeleteUnit}
        title="Hapus Unit?"
        message="Apakah Anda yakin ingin menghapus unit ini? Seluruh data lesson dan kuis yang ada di dalam unit ini juga akan dihapus secara permanen."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
