"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { COURSES } from '@/lib/dummydata';
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
  CheckCircle,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'coding';
  duration: string;
  isCompleted: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as 'video' | 'reading' | 'coding',
    duration: '',
  });
  
  // Mock lessons data - MUST be before any conditional returns
  const [lessons, setLessons] = useState<Lesson[]>([
    { id: '1', title: 'Introduction to the Course', type: 'video', duration: '10 min', isCompleted: false },
    { id: '2', title: 'Setting Up Your Environment', type: 'reading', duration: '15 min', isCompleted: false },
    { id: '3', title: 'Your First Code Exercise', type: 'coding', duration: '20 min', isCompleted: false },
  ]);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const course = COURSES.find(c => c.id === params.courseId);
  
  if (!course) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-zinc-500">Course not found</p>
        <Link href="/admin/courses">
          <Button className="mt-4">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: lessonForm.title,
      type: lessonForm.type,
      duration: lessonForm.duration,
      isCompleted: false
    };
    setLessons([...lessons, newLesson]);
    setShowAddLesson(false);
    setLessonForm({ title: '', type: 'video', duration: '' });
  };

  const getLessonIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-5 h-5 text-blue-600" />;
      case 'reading': return <FileText className="w-5 h-5 text-green-600" />;
      case 'coding': return <Code className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/courses">
            <Button variant="ghost" className="mb-4 hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Courses
            </Button>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg",
                  course.color
                )}>
                  {course.image || '💻'}
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {course.title}
                  </h1>
                  <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-3">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      course.difficulty === 'beginner' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      course.difficulty === 'intermediate' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                      course.difficulty === 'advanced' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    )}>
                      {course.difficulty.toUpperCase()}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {lessons.length} lessons • {course.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setShowAddLesson(!showAddLesson)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Lesson
              </Button>
            </div>
          </div>
        </div>

        {/* Add Lesson Form */}
        {showAddLesson && (
          <Card className="p-6 rounded-2xl border-2 mb-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
              Tambah Lesson Baru
            </h3>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonTitle">Judul Lesson *</Label>
                  <Input
                    id="lessonTitle"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                    placeholder="Contoh: Introduction to React Hooks"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonType">Tipe Lesson *</Label>
                  <select
                    id="lessonType"
                    value={lessonForm.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLessonForm({...lessonForm, type: e.target.value as any})}
                    className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  >
                    <option value="video">📹 Video</option>
                    <option value="reading">📖 Reading</option>
                    <option value="coding">💻 Coding Exercise</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Durasi</Label>
                <Input
                  id="duration"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                  placeholder="Contoh: 15 min"
                  className="h-11"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Lesson
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddLesson(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Lessons List */}
        <Card className="p-6 rounded-2xl border-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
            Daftar Lessons ({lessons.length})
          </h3>

          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div 
                key={lesson.id}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 bg-gradient-to-r from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 group"
              >
                <div className="cursor-move text-zinc-400 hover:text-zinc-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-600 dark:text-zinc-400">
                  {index + 1}
                </div>

                <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                  {getLessonIcon(lesson.type)}
                </div>

                <div className="flex-1">
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
                    {lesson.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="capitalize">{lesson.type}</span>
                    <span>•</span>
                    <span>{lesson.duration}</span>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-950/30">
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/30"
                    onClick={() => setLessons(lessons.filter(l => l.id !== lesson.id))}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {lessons.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                Belum ada lesson
              </p>
              <Button onClick={() => setShowAddLesson(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Lesson Pertama
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
