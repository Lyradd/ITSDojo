"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import { Button } from "@/components/ui/button";
import { 
  BookOpen, Star, Lock, ListFilter, ChevronDown, Check, LayoutGrid, List
} from "lucide-react";
import { COURSES as RAW_COURSES } from "@/lib/dummydata"; 
import { useUserStore } from "@/lib/store"; 

type SortOption = "name-asc" | "last-accessed";
type ViewMode = "grid" | "list"; 

export default function CoursesPage() {
  const router = useRouter();
  const { setActiveCourse } = useUserStore(); // Ambil fungsi dari store
  
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 1. Menyiapkan Data
  const processedCourses = useMemo(() => {
    return RAW_COURSES.map((course, index) => {
      const mockDate = new Date();
      mockDate.setDate(mockDate.getDate() - (index * 2));
      let mockProgress = 0;
      if (index === 0) mockProgress = 75;
      if (index === 1) mockProgress = 30;
      return {
        ...course,
        status: index === 0 ? "unlocked" : "locked",
        lastAccessed: mockDate,
        progress: mockProgress,
      };
    });
  }, []);

  // 2. Logika Sorting
  const sortedCourses = useMemo(() => {
    const data = [...processedCourses];
    return data.sort((a, b) => {
      if (sortOption === "name-asc") return a.title.localeCompare(b.title);
      else if (sortOption === "last-accessed") return b.lastAccessed.getTime() - a.lastAccessed.getTime();
      return 0;
    });
  }, [processedCourses, sortOption]);

  const formatDate = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);

  // Fungsi Handler saat kursus dipilih
  const handleSelectCourse = (courseId: string) => {
    setActiveCourse(courseId); // 1. Set kursus aktif di global state
    router.push("/learn");     // 2. Pindah ke halaman Learn
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Overview</h1>
          <p className="text-zinc-500 mt-1">Pilih kursus untuk menjadikannya materi belajar aktifmu.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border">
            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${viewMode === "grid" ? "bg-white shadow-sm dark:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900"}`} onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${viewMode === "list" ? "bg-white shadow-sm dark:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900"}`} onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <Button variant="outline" className="gap-2 min-w-[180px] justify-between" onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-zinc-500" />
                <span>{sortOption === "name-asc" ? "Name (A-Z)" : "Last Accessed"}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
            </Button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-[200px] rounded-md border bg-white p-1 shadow-lg z-20 dark:bg-zinc-950 dark:border-zinc-800">
                  <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500">Urutkan Berdasarkan</div>
                  <button onClick={() => { setSortOption("name-asc"); setIsFilterOpen(false); }} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    {sortOption === "name-asc" && <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"><Check className="h-4 w-4" /></span>}
                    Course Name (A-Z)
                  </button>
                  <button onClick={() => { setSortOption("last-accessed"); setIsFilterOpen(false); }} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    {sortOption === "last-accessed" && <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"><Check className="h-4 w-4" /></span>}
                    Last Accessed
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      
      {/* MODE 1: GRID VIEW (CARD) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {sortedCourses.map((course) => (
            <div key={course.id} className="group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/50 overflow-hidden">
              {/* Header Gambar */}
              <div className={`h-32 w-full ${course.color} flex items-center justify-center text-6xl relative transition-all duration-300 group-hover:h-24`}>
                {course.image}
                {course.status === 'locked' && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                    <Lock className="w-8 h-8 text-zinc-600/50" />
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {course.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>+{course.xpReward} XP</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                
                <p className="text-xs text-zinc-400 mb-2">
                  Last activity: {formatDate(course.lastAccessed)}
                </p>

                {/* Progress Bar (GRID) */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-500">Progress</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{course.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        course.status === 'locked' ? 'bg-zinc-300' : 'bg-blue-600'
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Deskripsi: Hidden Default, Block on Hover */}
                <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
                  <p className="text-sm text-zinc-500 mb-4 pt-1">
                    {course.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t flex items-center justify-between">
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {course.lessonsCount} Modules
                  </div>
                  
                  {course.status === 'unlocked' ? (
                    <Button size="sm" onClick={() => handleSelectCourse(course.id)}>
                      {course.progress > 0 ? "Lanjutkan" : "Mulai Belajar"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled>Terkunci</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE 2: LIST VIEW */
        <div className="flex flex-col gap-4">
          {sortedCourses.map((course) => (
            <div key={course.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border bg-card hover:bg-zinc-50/50 hover:border-blue-500/30 transition-all dark:hover:bg-zinc-900">
              {/* Icon Box */}
              <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-lg shrink-0 ${course.color} flex items-center justify-center text-3xl sm:text-4xl relative overflow-hidden`}>
                {course.image}
                {course.status === 'locked' && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                    <Lock className="w-5 h-5 text-zinc-600/50" />
                  </div>
                )}
              </div>

              {/* Content Center */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold truncate group-hover:text-blue-600 transition-colors">
                            {course.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                            {course.difficulty}
                        </span>
                    </div>
                </div>
                
                <p className="text-sm text-zinc-500 line-clamp-1 mb-3">
                  {course.description}
                </p>

                {/* Progress Bar (LIST) */}
                <div className="flex items-center gap-4 mb-2 max-w-md">
                   <div className="h-2 flex-1 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                        <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            course.status === 'locked' ? 'bg-zinc-300' : 'bg-blue-600'
                        }`}
                        style={{ width: `${course.progress}%` }}
                        />
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 min-w-[3ch]">
                        {course.progress}%
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {course.lessonsCount} Modul
                  </span>
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <Star className="w-3 h-3 fill-current" /> +{course.xpReward} XP
                  </span>
                  <span>
                     • {formatDate(course.lastAccessed)}
                  </span>
                </div>
              </div>

              {/* Action Right */}
              <div className="shrink-0 self-end sm:self-center mt-2 sm:mt-0 w-full sm:w-auto">
                 {course.status === 'unlocked' ? (
                    <Button size="sm" className="w-full sm:w-auto" onClick={() => handleSelectCourse(course.id)}>
                      {course.progress > 0 ? "Lanjutkan" : "Mulai"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled className="text-zinc-400 w-full sm:w-auto">
                      <Lock className="w-4 h-4 mr-1" /> Terkunci
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}