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
import toast from 'react-hot-toast';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import dynamic from 'next/dynamic';
import VideoUrlInput from '@/components/admin/video-url-input';
import MaterialUpload from '@/components/admin/material-upload';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor'), { ssr: false });

import LessonEditor, { LessonForm, EMPTY_LESSON, MaterialFile } from '@/components/admin/lesson-editor';
import UnitEditor, { UnitFormValues } from '@/components/admin/unit-editor';

const DragHandleItem = ({ value, children, className }: { value: any, children: (controls: any) => React.ReactNode, className?: string }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item value={value} dragListener={false} dragControls={controls} className={className}>
      {children(controls)}
    </Reorder.Item>
  );
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

  const [showAddLesson, setShowAddLesson] = useState<number | null>(null); // unitId
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>({ ...EMPTY_LESSON });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteUnitConfirmId, setDeleteUnitConfirmId] = useState<number | null>(null);

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseEditForm, setCourseEditForm] = useState({ title: '', description: '' });

  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, unitsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/units`),
      ]);
      const singleCourse = await coursesRes.json();
      const unitsData = await unitsRes.json();
      setCourse(singleCourse || null);
      setUnits(unitsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- UNIT CRUD ---
  const handleCreateUnit = async (data: UnitFormValues) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dosen' },
        body: JSON.stringify({ ...data, courseId }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(`Gagal: ${err.error}`); return; }
      const newUnit = await res.json();
      setUnits(prev => [...prev, { ...newUnit, lessons: [] }].sort((a, b) => a.order - b.order));
      toast.success('Unit berhasil ditambahkan!');
      setShowAddUnit(false);
      fetchData();
    } catch (err) { 
      console.error(err); 
      toast.error('Terjadi kesalahan jaringan.');
    }
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
        setCourse((prev: any) => ({ ...prev, title: courseEditForm.title, description: courseEditForm.description }));
        toast.success('Info kelas diperbarui!');
        setIsEditingCourse(false);
        fetchData();
      } else {
        toast.error("Gagal memperbarui info kelas");
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUnit = async (data: UnitFormValues, unitId: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/units/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'dosen'
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updatedUnit = await res.json();
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, ...updatedUnit } : u).sort((a, b) => a.order - b.order));
        toast.success('Unit berhasil diperbarui!');
        setEditingUnitId(null);
        fetchData();
      } else {
        toast.error("Gagal memperbarui unit");
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };



  // --- LESSON CRUD ---
  const handleSaveLesson = async (data: LessonForm, unitId: number) => {
    setSaving(true);
    try {
      const url = editingLessonId
        ? `/api/admin/lessons/${editingLessonId}`
        : '/api/admin/lessons';
      const method = editingLessonId ? 'PUT' : 'POST';

      const durationNum = data.duration ? data.duration.replace(/\D/g, '') : '';
      const formattedDuration = durationNum ? `${durationNum} menit` : '';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dosen' },
        body: JSON.stringify({
          ...data,
          duration: formattedDuration,
          materialFiles: JSON.stringify(data.materialFiles),
          unitId
        }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(`Gagal: ${err.error}`); return; }

      const returnedLesson = await res.json();
      setUnits(prev => prev.map(u => {
        if (u.id !== unitId) return u;
        let newLessons = u.lessons || [];
        if (editingLessonId) {
          newLessons = newLessons.map((l: any) => l.id === editingLessonId ? { ...l, ...returnedLesson } : l);
        } else {
          newLessons = [...newLessons, returnedLesson];
        }
        newLessons.sort((a: any, b: any) => a.order - b.order);
        return { ...u, lessons: newLessons };
      }));

      toast.success(editingLessonId ? 'Lesson diperbarui!' : 'Lesson berhasil ditambahkan!');
      setShowAddLesson(null);
      setEditingLessonId(null);
      setLessonForm({ ...EMPTY_LESSON });
      fetchData();
    } catch (err) { 
      console.error(err); 
      toast.error('Terjadi kesalahan jaringan.');
    }
    finally { setSaving(false); }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    setDeleteConfirmId(lessonId);
  };

  const handleConfirmDeleteLesson = async () => {
    if (deleteConfirmId === null) return;
    const lessonToDelete = deleteConfirmId;
    setDeleteConfirmId(null);

    setUnits(prev => prev.map(u => ({
      ...u,
      lessons: (u.lessons || []).filter((l: any) => l.id !== lessonToDelete)
    })));

    try {
      await fetch(`/api/admin/lessons/${lessonToDelete}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'dosen' },
      });
      toast.success('Lesson dihapus!');
      fetchData();
    } catch (err) { 
      console.error(err); 
      toast.error('Terjadi kesalahan jaringan.');
    }
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
        setUnits(prev => prev.filter(u => u.id !== deleteUnitConfirmId));
        toast.success('Unit berhasil dihapus!');
        fetchData();
      } else {
        toast.error("Gagal menghapus unit");
      }
    } catch (err) { 
      console.error(err); 
      toast.error('Terjadi kesalahan jaringan.');
    }
    setDeleteUnitConfirmId(null);
  };

  const handleReorderUnits = async (newOrderUnits: any[]) => {
    setUnits(newOrderUnits);
    const payload = newOrderUnits.map((u, idx) => ({ id: u.id, order: idx + 1 }));
    try {
      await fetch('/api/admin/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dosen' },
        body: JSON.stringify({ type: 'units', items: payload })
      });
    } catch (e) {
      toast.error('Gagal mengurutkan unit');
      fetchData();
    }
  };

  const handleReorderLessons = async (unitId: number, newLessons: any[]) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, lessons: newLessons } : u));
    const payload = newLessons.map((l, idx) => ({ id: l.id, order: idx + 1 }));
    try {
      await fetch('/api/admin/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'dosen' },
        body: JSON.stringify({ type: 'lessons', items: payload })
      });
    } catch (e) {
      toast.error('Gagal mengurutkan lesson');
      fetchData();
    }
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

  // --- RENDER ---
  if (loading && !course) {
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
            <UnitEditor
              isEditing={false}
              initialData={{ title: '', description: '', order: units.length + 1 }}
              saving={saving}
              onSubmit={handleCreateUnit}
              onCancel={() => setShowAddUnit(false)}
            />
          </Card>
        )}

        {/* Units & Lessons */}
        {units.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border-2 bg-white/80 dark:bg-zinc-900/80">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 mb-4">Belum ada unit. Mulai dengan membuat unit pertama!</p>
          </Card>
        ) : (
          <Reorder.Group axis="y" values={units} onReorder={handleReorderUnits} className="space-y-6">
            {units.map((unit: any) => (
              <DragHandleItem key={unit.id} value={unit} className="list-none">
                {(unitControls) => (
                  <Card className="p-6 rounded-2xl border-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm relative">
                <div className="flex items-center justify-between mb-4">
                  {editingUnitId === unit.id ? (
                    <UnitEditor
                      isEditing={true}
                      initialData={{ title: unit.title, description: unit.description || '', order: unit.order || 1 }}
                      saving={saving}
                      onSubmit={(data) => handleUpdateUnit(data, unit.id)}
                      onCancel={() => setEditingUnitId(null)}
                    />
                  ) : (
                    <div className="flex-1 group flex items-start gap-2">
                      <div onPointerDown={(e) => unitControls.start(e)} className="cursor-grab active:cursor-grabbing p-1.5 mt-0.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{unit.title}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                            onClick={() => setEditingUnitId(unit.id)}
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
                      onClick={() => setEditingUnitId(unit.id)}
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
                <Reorder.Group axis="y" values={unit.lessons || []} onReorder={(newLessons) => handleReorderLessons(unit.id, newLessons)} className="space-y-2">
                  {(unit.lessons || []).map((lesson: any, idx: number) => (
                    <DragHandleItem key={lesson.id} value={lesson} className="space-y-2 list-none">
                      {(lessonControls) => (
                        <>
                          <div
                            onClick={() => handleEditLesson(lesson)}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-white dark:bg-zinc-900 group cursor-pointer select-none"
                          >
                            <div 
                              onPointerDown={(e) => lessonControls.start(e)} 
                              className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 flex items-center justify-center p-1 -ml-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
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
                            <LessonEditor 
                              unitId={unit.id} 
                              initialData={lessonForm} 
                              saving={saving} 
                              onSubmit={handleSaveLesson} 
                              onCancel={() => { setShowAddLesson(null); setEditingLessonId(null); setLessonForm({ ...EMPTY_LESSON }); }} 
                              isEditing={editingLessonId === lesson.id} 
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                        </>
                      )}
                    </DragHandleItem>
                  ))}
                </Reorder.Group>

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
                        <LessonEditor 
                          unitId={unit.id} 
                          initialData={lessonForm} 
                          saving={saving} 
                          onSubmit={handleSaveLesson} 
                          onCancel={() => { setShowAddLesson(null); setEditingLessonId(null); setLessonForm({ ...EMPTY_LESSON }); }} 
                          isEditing={false} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
              </Card>
                )}
              </DragHandleItem>
            ))}
          </Reorder.Group>
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
