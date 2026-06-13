"use client";

import { useUserStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseSelectorDropdownProps {
  courses: any[];
}

export function CourseSelectorDropdown({ courses }: CourseSelectorDropdownProps) {
  const router = useRouter();
  const { activeCourseId, setActiveCourse, enrolledCourseIds, semester } = useUserStore();

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  
  // Ambil kursus yang sesuai dengan semester pengguna (serta status enrollment)
  const enrolledCourses = courses.filter((c) => {
    const isEnrolled = enrolledCourseIds && enrolledCourseIds.length > 0 ? enrolledCourseIds.includes(c.id) : true;
    const isMatchingSemester = semester ? c.requiredSemester === semester : true;
    return isEnrolled && isMatchingSemester;
  });

  if (!activeCourse) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Pilih Kursus" className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0">
          <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 z-[100] border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950 mt-1">
        <DropdownMenuLabel className="text-xs text-zinc-500 font-black uppercase tracking-wider px-2 py-2 mb-3">
          Kursus Saya
        </DropdownMenuLabel>
        <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600">
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map((course) => (
              <DropdownMenuItem
                key={course.id}
                onClick={() => {
                  setActiveCourse(course.id);
                }}
                className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-colors duration-200 mb-1 ${
                  activeCourseId === course.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex shrink-0 items-center justify-center border shadow-sm ${
                    activeCourseId === course.id
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-bold truncate ${
                    activeCourseId === course.id
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}>
                    {course.title}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-zinc-500 text-center">
              Belum ada kursus
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
