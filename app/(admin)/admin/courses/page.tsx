"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Eye,
  Search,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CoursesManagementPage() {
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const isAsdos = role === 'asdos';
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    xpReward: 100,
    lessons: 0,
    color: 'bg-blue-200 text-blue-700',
    icon: '💻'
  });

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const filteredCourses = COURSES.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock create - in real app would call API
    alert('Kursus berhasil dibuat! (Mock action)');
    setShowCreateForm(false);
    setFormData({
      title: '',
      description: '',
      difficulty: 'beginner',
      xpReward: 100,
      lessons: 0,
      color: 'bg-blue-200 text-blue-700',
      icon: '💻'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isAsdos ? 'Lihat Kursus' : 'Kelola Kursus'}
                </h1>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                {isAsdos ? 'Lihat materi pembelajaran yang tersedia' : 'Tambah, edit, dan kelola materi pembelajaran'}
              </p>
            </div>
            {!isAsdos && (
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg"
              >
                {showCreateForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Kursus Baru
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Create Form - Dosen only */}
        {!isAsdos && showCreateForm && (
          <Card className="p-6 rounded-2xl border-2 mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
              Buat Kursus Baru
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Kursus *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: React JS Mastery"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Tingkat Kesulitan *</Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Jelaskan tentang kursus ini..."
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp">XP Reward</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData({...formData, xpReward: parseInt(e.target.value)})}
                    min="0"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessons">Jumlah Pelajaran</Label>
                  <Input
                    id="lessons"
                    type="number"
                    value={formData.lessons}
                    onChange={(e) => setFormData({...formData, lessons: parseInt(e.target.value)})}
                    min="0"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="💻"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Kursus
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <Card className="p-4 rounded-2xl border-2 mb-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Cari kursus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </Card>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id}
              className="p-6 rounded-2xl border-2 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm group"
            >
              {/* Icon & Title */}
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform",
                  course.color
                )}>
                  {course.image || '💻'}
                </div>
                <div className="flex gap-1">
                  {!isAsdos && (
                    <>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-950/30">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-950/30">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{course.lessonsCount}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 ml-1">lessons</span>
                </div>
                <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <span className="font-bold text-yellow-700 dark:text-yellow-400">{course.xpReward}</span>
                  <span className="text-yellow-600 dark:text-yellow-500 ml-1">XP</span>
                </div>
              </div>

              {/* Difficulty Badge */}
              <div className="mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  course.difficulty === 'beginner' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  course.difficulty === 'intermediate' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  course.difficulty === 'advanced' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                )}>
                  {course.difficulty.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/admin/courses/${course.id}`} className="flex-1">
                  <Button variant="outline" className="w-full font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">
                    <Eye className="w-4 h-4 mr-2" />
                    {isAsdos ? 'Lihat Materi' : 'Kelola Materi'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 dark:text-zinc-400">
              Tidak ada kursus yang ditemukan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
