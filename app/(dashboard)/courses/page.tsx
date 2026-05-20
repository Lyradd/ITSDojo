"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Star, Lock, ListFilter, ChevronDown, Check, LayoutGrid, List, Search, Bookmark, BookmarkCheck
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

type SortOption = "name-asc" | "last-accessed" | "progress-desc";
type ViewMode = "grid" | "list";

import { CircularProgress } from "@/components/ui/circular-progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CoursesPage() {
  const router = useRouter();
  const { 
    setActiveCourse, level, completedLessonIds, semester, 
    enrolledCourseIds, pendingCourseIds, rejectedCourseIds, acceptedCourseIds,
    requestEnrollment, clearAllRejectedCourses, clearAllAcceptedCourses,
    courseAccessHistory, bookmarkedCourseIds, toggleBookmarkCourse 
  } = useUserStore();

  const toastedRef = useRef<Set<string>>(new Set());

  // Toast untuk request Ditolak
  useEffect(() => {
    if (rejectedCourseIds && rejectedCourseIds.length > 0) {
      rejectedCourseIds.forEach(courseId => {
        if (!toastedRef.current.has(courseId)) {
          toastedRef.current.add(courseId);
          const formattedTitle = courseId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          toast.error(`Permintaan akses untuk kelas ${formattedTitle} ditolak.`, { 
            icon: '❌', 
            duration: 6000,
            style: { border: '1px solid #fee2e2', color: '#b91c1c' }
          });
        }
      });
      // Bersihkan state di Zustand agar tidak muncul lagi di mount berikutnya
      clearAllRejectedCourses();
    }
  }, [rejectedCourseIds, clearAllRejectedCourses]);

  // Toast untuk request Diterima
  useEffect(() => {
    if (acceptedCourseIds && acceptedCourseIds.length > 0) {
      acceptedCourseIds.forEach(courseId => {
        if (!toastedRef.current.has(courseId)) {
          toastedRef.current.add(courseId);
          const formattedTitle = courseId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          toast.success(`Selamat! Permintaan akses untuk kelas ${formattedTitle} telah diterima.`, { 
            icon: '✅', 
            duration: 6000,
            style: { border: '1px solid #dcfce7', color: '#15803d' }
          });
        }
      });
      // Bersihkan state di Zustand agar tidak muncul lagi di mount berikutnya
      clearAllAcceptedCourses();
    }
  }, [acceptedCourseIds, clearAllAcceptedCourses]);

  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [imageErrorIds, setImageErrorIds] = useState<string[]>([]);

  // === DATA DARI API (bukan dummy) ===
  const [apiCourses, setApiCourses] = useState<any[]>([]);
  const [courseLessonCounts, setCourseLessonCounts] = useState<Record<string, number>>({});
  const [courseLessonIds, setCourseLessonIds] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      setApiCourses(data);

      // Untuk setiap kursus, ambil jumlah lesson dan ID-nya dari units API
      const counts: Record<string, number> = {};
      const ids: Record<string, string[]> = {};
      await Promise.all(
        data.map(async (course: any) => {
          try {
            const unitsRes = await fetch(`/api/courses/${course.id}/units`);
            const unitsData = await unitsRes.json();
            const lessonIdList: string[] = [];
            for (const unit of unitsData) {
              for (const lesson of (unit.lessons || [])) {
                lessonIdList.push(String(lesson.id));
              }
            }
            counts[course.id] = lessonIdList.length;
            ids[course.id] = lessonIdList;
          } catch {
            counts[course.id] = 0;
            ids[course.id] = [];
          }
        })
      );
      setCourseLessonCounts(counts);
      setCourseLessonIds(ids);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Data Processing (Mapping, Filtering, Sorting)
  const sortedCourses = useMemo(() => {
    // 1. Map status and progress
    let data = apiCourses.map((course) => {
      const lessonsCount = courseLessonCounts[course.id] || 0;
      const lessonIdsForCourse = courseLessonIds[course.id] || [];
      const completedCount = lessonIdsForCourse.filter(id => completedLessonIds.includes(id)).length;
      const progress = Math.min(Math.floor((completedCount / (lessonsCount || 1)) * 100), 100);

      const accessDateStr = courseAccessHistory?.[course.id];
      const lastAccessed = accessDateStr ? new Date(accessDateStr) : new Date(0);

      const semesterRequired = course.requiredSemester || 1;
      const isSemesterMet = semester >= semesterRequired;

      let status = 'locked'; 
      if (!isSemesterMet) {
        status = 'semester-locked';
      } else if (enrolledCourseIds.includes(course.id)) {
        status = 'unlocked';
      } else if (pendingCourseIds.includes(course.id)) {
        status = 'pending';
      }

      return {
        ...course,
        image: course.imageSrc,
        progress,
        status,
        semesterRequired,
        isSemesterMet,
        unitsCount: course.unitsCount || 0,
        lessonsCount: course.lessonsCount || 0,
        lastAccessed,
      };
    });

    // 2. Filter by saved only if active
    if (showSavedOnly) {
      data = data.filter(c => bookmarkedCourseIds.includes(c.id));
    }

    // 3. Filter by search query
    if (searchQuery.trim() !== "") {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(c => c.title.toLowerCase().includes(lowerQ) || c.description.toLowerCase().includes(lowerQ));
    }

    // 4. Sort
    return data.sort((a, b) => {
      if (sortOption === "name-asc") return a.title.localeCompare(b.title);
      else if (sortOption === "last-accessed") return b.lastAccessed.getTime() - a.lastAccessed.getTime();
      else if (sortOption === "progress-desc") return b.progress - a.progress;
      return 0;
    });
  }, [apiCourses, courseLessonCounts, courseLessonIds, completedLessonIds, semester, enrolledCourseIds, pendingCourseIds, courseAccessHistory, searchQuery, sortOption, bookmarkedCourseIds, showSavedOnly]);

  const formatDate = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);

  // Fungsi Handler saat kursus dipilih
  const handleSelectCourse = (courseId: string) => {
    setActiveCourse(courseId); // 1. Set kursus aktif di global state
    router.push("/learn");     // 2. Pindah ke halaman Learn
  };

  const handleToggleBookmark = (courseId: string) => {
    const isCurrentlyBookmarked = bookmarkedCourseIds.includes(courseId);
    toggleBookmarkCourse(courseId);
    if (isCurrentlyBookmarked) {
      toast("Kelas dihapus dari simpanan.", { icon: "🔖" });
    } else {
      toast.success("Kelas disimpan!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      {/* --- HEADER SECTION --- */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl" />
        <div className="relative">
          {/* Row 1: Title and Saved Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold tracking-tight text-blue-700 dark:text-white">Daftar Kelas</h1>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-lg">Pilih kelas untuk menjadikannya materi belajar aktifmu.</p>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              {/* Saved Toggle Button */}
              <Button 
                variant={showSavedOnly ? "secondary" : "outline"} 
                className={`gap-2 ${showSavedOnly ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" : ""}`}
                onClick={() => setShowSavedOnly(!showSavedOnly)}
              >
                {showSavedOnly ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>Tersimpan {bookmarkedCourseIds.length > 0 && `(${bookmarkedCourseIds.length})`}</span>
              </Button>
            </div>
          </div>

          {/* Row 2: Search, View Toggle, and Sort */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                type="text" 
                placeholder="Cari kelas..." 
                className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Filter Dropdown */}
              <DropdownMenu open={isSortOpen} onOpenChange={setIsSortOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
                    <div className="flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-zinc-500" />
                      <span>{
                        sortOption === "name-asc" ? "Nama Kelas (A-Z)" : 
                        sortOption === "progress-desc" ? "Progres Tertinggi" : 
                        "Terakhir Diakses"
                      }</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Urutkan Berdasarkan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOption("name-asc")} className="flex items-center gap-2 cursor-pointer">
                    {sortOption === "name-asc" ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                    Nama Kelas (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("last-accessed")} className="flex items-center gap-2 cursor-pointer">
                    {sortOption === "last-accessed" ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                    Terakhir Diakses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("progress-desc")} className="flex items-center gap-2 cursor-pointer">
                    {sortOption === "progress-desc" ? <Check className="w-4 h-4" /> : <div className="w-4 h-4" />}
                    Progres Tertinggi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex items-center p-1 bg-background rounded-md border border-input shrink-0">
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-sm ${viewMode === "grid" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"}`} onClick={() => setViewMode("grid")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-sm ${viewMode === "list" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"}`} onClick={() => setViewMode("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}

      {/* Empty State: Saved filter active but nothing bookmarked */}
      {sortedCourses.length === 0 && showSavedOnly ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Belum ada kursus yang disimpan</h3>
          <p className="text-sm text-zinc-500 max-w-sm">Klik ikon bookmark pada kursus untuk menyimpannya agar mudah diakses kembali.</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowSavedOnly(false)}>Tampilkan Semua Kursus</Button>
        </div>
      ) : sortedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tidak ada hasil ditemukan</h3>
          <p className="text-sm text-zinc-500 max-w-sm">Coba ubah kata kunci pencarian Anda.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course) => (
            <div 
              key={course.id} 
              className="group relative flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/25 hover:-translate-y-2 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden"
              onMouseEnter={() => setHoveredCourseId(course.id)}
              onMouseLeave={() => setHoveredCourseId(null)}
            >
              {/* Header Gambar */}
              <div className={`h-32 w-full flex items-center justify-center relative overflow-hidden transition-all duration-300 ${course.status === 'semester-locked' ? 'grayscale opacity-60' : ''}`}>
                <div className={`absolute inset-0 ${course.color} opacity-20`} />
                {course.image && !imageErrorIds.includes(course.id) ? (
                  <Image 
                    src={course.image} 
                    alt={course.title} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    onError={() => setImageErrorIds(prev => [...prev, course.id])}
                  />
                ) : (
                  <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${course.color} opacity-40 transition-transform duration-500 group-hover:scale-105`}>
                    <BookOpen className="w-12 h-12 text-white/50" />
                  </div>
                )}
                {(course.status === 'locked' || course.status === 'semester-locked') && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                    <Lock className="w-8 h-8 text-white/70" />
                  </div>
                )}
                {/* Bookmark Button Overlay */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleBookmark(course.id);
                  }}
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md shadow-md transition-all active:scale-90 ${
                    bookmarkedCourseIds.includes(course.id) 
                      ? "bg-blue-600 text-white" 
                      : "bg-white/50 text-zinc-800 hover:bg-white"
                  }`}
                >
                  {bookmarkedCourseIds.includes(course.id) 
                    ? <BookmarkCheck className="w-4 h-4" /> 
                    : <Bookmark className="w-4 h-4" />
                  }
                </button>
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
                  Aktivitas terakhir: {course.lastAccessed.getTime() === 0 ? "Belum diakses" : formatDate(course.lastAccessed)}
                </p>

                {/* Status & Progress */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Status Belajar</span>
                    <span className={`text-sm font-bold ${course.status === 'semester-locked' ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {course.status === 'unlocked' ? 'Lanjutkan Materi'
                        : course.status === 'pending' ? 'Menunggu Approval'
                          : course.status === 'semester-locked' ? `Butuh Semester ${course.semesterRequired}`
                            : 'Minta Akses'}
                    </span>
                  </div>
                  {course.status === 'unlocked' || course.status === 'pending' ? (
                    <CircularProgress progress={course.progress} color={course.progress === 100 ? "text-green-500" : "text-blue-600"} />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Lock className={`w-5 h-5 ${course.status === 'semester-locked' ? 'text-red-400' : 'text-zinc-400'}`} />
                    </div>
                  )}
                </div>

                <p className="text-sm text-zinc-500 mb-4 line-clamp-2 mt-2">
                  {course.description}
                </p>

                <div className="mt-auto pt-4 border-t flex flex-col gap-3">
                  <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{course.unitsCount} Unit • {course.lessonsCount} Materi</span>
                  </div>

                  {course.status === 'unlocked' ? (
                    <Button size="sm" className="w-full font-bold" onClick={() => handleSelectCourse(course.id)}>
                      {course.progress > 0 ? "Lanjutkan" : "Mulai Belajar"}
                    </Button>
                  ) : course.status === 'pending' ? (
                    <Button size="sm" variant="secondary" disabled className="w-full font-bold">Menunggu Persetujuan</Button>
                  ) : course.status === 'semester-locked' ? (
                    <Button size="sm" variant="ghost" disabled className="text-red-400 text-xs w-full font-bold justify-start">
                      <Lock className="w-3 h-3 mr-1" /> Semester Belum Tercapai
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full font-bold" onClick={() => requestEnrollment(course.id)}>Minta Akses Kelas</Button>
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
              <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-lg shrink-0 flex items-center justify-center relative overflow-hidden ${course.status === 'semester-locked' ? 'grayscale opacity-60' : ''}`}>
                <div className={`absolute inset-0 ${course.color} opacity-20`} />
                {course.image && !imageErrorIds.includes(course.id) ? (
                  <Image 
                    src={course.image} 
                    alt={course.title} 
                    fill 
                    className="object-cover" 
                    onError={() => setImageErrorIds(prev => [...prev, course.id])}
                  />
                ) : (
                  <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${course.color} opacity-40`}>
                    <BookOpen className="w-8 h-8 text-white/50" />
                  </div>
                )}
                {(course.status === 'locked' || course.status === 'semester-locked') && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                    <Lock className="w-5 h-5 text-white/70" />
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(course.id);
                      }}
                      className={`ml-2 p-1.5 rounded-lg transition-all active:scale-90 ${
                        bookmarkedCourseIds.includes(course.id) 
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40" 
                          : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {bookmarkedCourseIds.includes(course.id) 
                        ? <BookmarkCheck className="w-4 h-4" /> 
                        : <Bookmark className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                <p className="text-sm text-zinc-500 line-clamp-1 mb-3">
                  {course.description}
                </p>

                {/* Circular Progress (LIST) — show only if enrolled or pending */}
                {(course.status === 'unlocked' || course.status === 'pending') && (
                  <div className="flex items-center gap-3 mb-3 max-w-md">
                    <CircularProgress progress={course.progress} size={36} strokeWidth={3} color={course.progress === 100 ? "text-green-500" : "text-blue-600"} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Target Belajar</span>
                      <span className="text-[10px] text-zinc-500">{course.progress}% Tuntas</span>
                    </div>
                  </div>
                )}
                {course.status === 'semester-locked' && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-red-500">🔒 Perlu minimal Semester {course.semesterRequired}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {course.unitsCount} Unit • {course.lessonsCount} Materi
                  </span>
                  <span className="flex items-center gap-1 text-amber-500 font-medium">
                    <Star className="w-3 h-3 fill-current" /> +{course.xpReward} XP
                  </span>
                  <span>
                    • {course.lastAccessed.getTime() === 0 ? "Belum diakses" : formatDate(course.lastAccessed)}
                  </span>
                </div>
              </div>

              {/* Action Right */}
              <div className="shrink-0 self-end sm:self-center mt-2 sm:mt-0 w-full sm:w-auto">
                {course.status === 'unlocked' ? (
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => handleSelectCourse(course.id)}>
                    {course.progress > 0 ? "Lanjutkan" : "Mulai"}
                  </Button>
                ) : course.status === 'pending' ? (
                  <Button size="sm" variant="secondary" disabled className="w-full sm:w-auto">
                    Menunggu Persetujuan
                  </Button>
                ) : course.status === 'semester-locked' ? (
                  <Button size="sm" variant="ghost" disabled className="text-red-400 text-xs w-full sm:w-auto">
                    <Lock className="w-3 h-3 mr-1" /> Semester Belum Tercapai
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => requestEnrollment(course.id)}>
                    <Lock className="w-4 h-4 mr-1" /> Minta Akses
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