"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { SAMPLE_EVALUATIONS } from '@/lib/evaluation-data';
import { COURSES } from '@/lib/dummydata';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  Clock, 
  Target, 
  Users,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EvaluationPage() {
  const router = useRouter();
  const { isLoggedIn, enrolledCourseIds } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) router.push('/login');
  }, [isLoggedIn, router, isMounted]);

  if (!isMounted || !isLoggedIn) return null;

  const enrolledEvaluations = SAMPLE_EVALUATIONS.filter(e => enrolledCourseIds.includes(e.courseId));
  const filteredEvaluations = selectedCourse === 'all'
    ? enrolledEvaluations
    : enrolledEvaluations.filter(e => e.courseId === selectedCourse);

  const getCourseName = (courseId: string) => COURSES.find(c => c.id === courseId)?.title || 'Unknown Course';
  const getCourseColor = (courseId: string) => COURSES.find(c => c.id === courseId)?.color || 'bg-gray-100 text-gray-600';

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Evaluasi & Quiz</h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">Uji pemahamanmu dan lihat posisimu di leaderboard real-time</p>
      </div>

      {/* Course Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Filter:</span>
          <Button size="sm" variant={selectedCourse === 'all' ? 'default' : 'outline'} onClick={() => setSelectedCourse('all')} className={cn("font-bold", selectedCourse === 'all' && "bg-blue-600 hover:bg-blue-700")}>
            Semua Kursus
          </Button>
          {COURSES.filter(c => enrolledCourseIds.includes(c.id)).map(course => (
            <Button key={course.id} size="sm" variant={selectedCourse === course.id ? 'default' : 'outline'} onClick={() => setSelectedCourse(course.id)} className={cn("font-bold", selectedCourse === course.id && "bg-blue-600 hover:bg-blue-700")}>
              {course.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Evaluations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvaluations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 dark:text-zinc-400">
              {enrolledCourseIds.length === 0
                ? "Kamu belum terdaftar di kelas manapun. Silakan minta akses kelas terlebih dahulu di menu Daftar Kelas."
                : "Tidak ada evaluasi untuk kursus ini"}
            </p>
          </div>
        ) : (
          filteredEvaluations.map(evaluation => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              getCourseName={getCourseName}
              getCourseColor={getCourseColor}
              onStart={() => router.push(`/evaluation/${evaluation.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Card Component with Warning Modal ──────────────────────────────────────
function EvaluationCard({ evaluation, getCourseName, getCourseColor, onStart }: {
  evaluation: typeof SAMPLE_EVALUATIONS[0];
  getCourseName: (id: string) => string;
  getCourseColor: (id: string) => string;
  onStart: () => void;
}) {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <>
      <Card className="p-6 rounded-2xl border-2 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
        {/* Course Badge */}
        <div className="mb-4">
          <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getCourseColor(evaluation.courseId))}>
            {getCourseName(evaluation.courseId)}
          </span>
        </div>

        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">{evaluation.title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{evaluation.description}</p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Target className="w-4 h-4" /><span>{evaluation.questions.length} soal</span><span>•</span><span>{evaluation.totalPoints} poin</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Clock className="w-4 h-4" /><span>{evaluation.duration} menit</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Users className="w-4 h-4" /><span>12 peserta aktif</span>
          </div>
        </div>

        {evaluation.isActive ? (
          <Button onClick={() => setShowWarning(true)} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
            <PlayCircle className="w-4 h-4 mr-2" />Mulai Evaluasi
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /><span>Sudah Selesai</span>
            </div>
            <Link href={`/evaluation/${evaluation.id}/results`}>
              <Button variant="outline" className="w-full font-bold">Lihat Hasil</Button>
            </Link>
          </div>
        )}

        {evaluation.isActive && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-bold">Evaluasi Aktif</span>
            </div>
          </div>
        )}
      </Card>

      {/* Pre-Quiz Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWarning(false)} />

          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 z-10">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5 text-4xl">
              ⚠️
            </div>

            <h3 className="text-2xl font-black text-center text-zinc-900 dark:text-white mb-3">
              Sebelum Mulai...
            </h3>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              <p>📌 Kuis ini berjalan secara <strong>real-time sinkronus</strong>. Kamu akan masuk ke ruang tunggu (lobby) sebelum Dosen memulai kuis.</p>
              <p>🎯 Kalau kamu sudah pernah mengerjakan, kamu <strong>bisa mengulanginya untuk belajar</strong>, tapi poin dan leaderboard tidak akan berubah lagi.</p>
              <p>⏱️ Durasi: <strong>{evaluation.duration} menit</strong> — timer berjalan otomatis ketika Dosen memulai sesi.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setShowWarning(false)} className="flex-1 font-bold rounded-2xl h-12 text-base">
                🚪 Nanti Dulu
              </Button>
              <Button
                onClick={() => { setShowWarning(false); onStart(); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl h-12 text-base shadow-lg shadow-blue-500/25"
              >
                🔥 Gas Sekarang!
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
