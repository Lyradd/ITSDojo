"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, Plus, LayoutGrid, List, Filter, Check, ChevronDown, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useUserStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DosenCoursesPage() {
  const router = useRouter();
  const { role, name } = useUserStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrorIds, setImageErrorIds] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [sortType, setSortType] = useState<'title' | 'semester'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Karena ini sistem dummy login, kita asumsikan ID dosen adalah 'dosen-1'
  // (Nanti saat NextAuth aktif, kita ambil langsung session-nya)
  const dosenId = 'dosen-1';

  useEffect(() => {
    async function fetchMyCourses() {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses`);
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    }

    if (dosenId) {
      fetchMyCourses();
    }
  }, [dosenId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredCourses = selectedSemester === 'all' 
    ? courses 
    : courses.filter(c => (c.requiredSemester || 1) === selectedSemester);

  let displayCourses = [...filteredCourses];
  if (sortType === 'title') {
    displayCourses.sort((a, b) => sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  } else {
    displayCourses.sort((a, b) => sortOrder === 'asc' ? (a.requiredSemester || 1) - (b.requiredSemester || 1) : (b.requiredSemester || 1) - (a.requiredSemester || 1));
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-blue-700 dark:text-white">Daftar Kelas</h1>
          </div>
          <p className="text-zinc-500 mt-1">Kelola materi pada semua kelas yang ada di sistem.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-md ${viewMode === 'card' ? 'bg-white dark:bg-zinc-800 shadow-xs' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 shadow-xs' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </Button>
          </div>

          {/* Split Dropdown Sort */}
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="gap-2 shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-r-none border-r-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <List className="w-4 h-4 text-zinc-500" />
              <span className="font-medium">
                {sortType === 'title' ? 'Nama Kelas' : 'Semester'}
              </span>
              {sortOrder === 'asc' ? (
                <ArrowDown className="w-4 h-4 text-zinc-500" />
              ) : (
                <ArrowUp className="w-4 h-4 text-zinc-500" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-2 shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-l-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="px-2 py-1.5 text-sm font-semibold text-zinc-500">Urutkan Berdasarkan</div>
                <DropdownMenuItem 
                  onSelect={() => {
                    if (sortType !== 'title') { setSortType('title'); setSortOrder('asc'); }
                  }} 
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>Nama Kelas</span>
                  {sortType === 'title' && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={() => {
                    if (sortType !== 'semester') { setSortType('semester'); setSortOrder('asc'); }
                  }} 
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>Semester</span>
                  {sortType === 'semester' && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <Filter className="w-4 h-4 text-zinc-500" />
                <span>
                  {selectedSemester === 'all' ? 'Semua Semester' : `Semester ${selectedSemester}`}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => setSelectedSemester('all')} className="flex items-center justify-between cursor-pointer">
                <span>Semua Semester</span>
                {selectedSemester === 'all' && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              {[1, 2, 3, 4, 5, 6, 7].map(sem => (
                <DropdownMenuItem key={sem} onClick={() => setSelectedSemester(sem)} className="flex items-center justify-between cursor-pointer">
                  <span>Semester {sem}</span>
                  {selectedSemester === sem && <Check className="w-4 h-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Belum Ada Kelas</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-4">
            Sistem belum memiliki kelas. Hubungi Admin untuk membuat kelas baru.
          </p>
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Filter className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tidak ada kelas</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-4">
            Tidak ada mata kuliah yang terdaftar pada semester ini.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {displayCourses.map((course) => (
            viewMode === 'card' ? (
              <div
                key={course.id}
                className="group flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/25 hover:-translate-y-2 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/dosen/courses/${course.id}`)}
              >
                {/* Header Gambar */}
                <div className="h-32 w-full flex items-center justify-center relative overflow-hidden transition-all duration-300">
                  <div className={`absolute inset-0 ${course.color || 'bg-blue-500'} opacity-20`} />
                  {course.imageSrc && !imageErrorIds.includes(course.id) ? (
                    <Image
                      src={course.imageSrc}
                      alt={course.title}
                      fill
                      className="object-cover"
                      onError={() => setImageErrorIds(prev => [...prev, course.id])}
                    />
                  ) : (
                    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${course.color || 'bg-blue-500'} opacity-40`}>
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {course.difficulty}
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                      Semester {course.requiredSemester || 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="mt-auto pt-4 border-t flex items-center gap-3">
                    <Button className="w-full" variant="outline">
                      Kelola Materi
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={course.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer"
                onClick={() => router.push(`/dosen/courses/${course.id}`)}
              >
                {/* List View Image */}
                <div className="h-20 w-32 shrink-0 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 hidden sm:flex">
                  <div className={`absolute inset-0 ${course.color || 'bg-blue-500'} opacity-20`} />
                  {course.imageSrc && !imageErrorIds.includes(course.id) ? (
                    <Image
                      src={course.imageSrc}
                      alt={course.title}
                      fill
                      className="object-cover"
                      onError={() => setImageErrorIds(prev => [...prev, course.id])}
                    />
                  ) : (
                    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${course.color || 'bg-blue-500'} opacity-40`}>
                      <BookOpen className="w-6 h-6 text-white/50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {course.difficulty}
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      Semester {course.requiredSemester || 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 group-hover:text-blue-600 transition-colors truncate">
                    {course.title}
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-1">
                    {course.description}
                  </p>
                </div>
                
                <div className="sm:pl-4 sm:border-l border-zinc-200 dark:border-zinc-800 shrink-0 w-full sm:w-auto">
                  <Button className="w-full sm:w-auto" variant="outline">
                    Kelola Materi
                  </Button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
