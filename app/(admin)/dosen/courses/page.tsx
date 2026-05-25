"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, Plus, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useUserStore } from "@/lib/store";

export default function DosenCoursesPage() {
  const router = useRouter();
  const { role, name } = useUserStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrorIds, setImageErrorIds] = useState<string[]>([]);

  // Karena ini sistem dummy login, kita asumsikan ID dosen adalah 'dosen-1'
  // (Nanti saat NextAuth aktif, kita ambil langsung session-nya)
  const dosenId = 'dosen-1';

  useEffect(() => {
    async function fetchMyCourses() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dosen/my-courses?dosenId=${dosenId}`);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-blue-700 dark:text-white">Daftar Kelas</h1>
          </div>
          <p className="text-zinc-500 mt-1">Kelola materi pada kelas yang Anda ampu.</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Belum Ada Kelas</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-4">
            Anda belum ditugaskan untuk mengampu kelas manapun. Hubungi SuperAdmin untuk penugasan kelas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
