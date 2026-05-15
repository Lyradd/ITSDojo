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
  Swords,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EvaluationPage() {
  const router = useRouter();
  const { isLoggedIn, enrolledCourseIds, name } = useUserStore();
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
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-2xl shadow-lg border border-indigo-200 dark:border-indigo-900/50">
              <Swords className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Arena Evaluasi</h1>
              <p className="text-zinc-600 dark:text-zinc-400">Adu kemampuan, raih posisi teratas</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 font-bold text-sm flex items-center shadow-md">
            <Trophy className="w-4 h-4 mr-2" />
            Rank kamu #3 dari 12
          </div>
        </div>
      </div>

      {/* Course Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedCourse('all')} 
            className={cn("font-bold rounded-xl border-zinc-200 dark:border-zinc-800", selectedCourse === 'all' && "bg-white dark:bg-zinc-900 shadow-sm border-zinc-300 dark:border-zinc-700")}
          >
            Semua Kursus
          </Button>
          {COURSES.filter(c => enrolledCourseIds.includes(c.id)).map(course => (
            <Button 
              key={course.id} 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedCourse(course.id)} 
              className={cn("font-bold rounded-xl border-zinc-200 dark:border-zinc-800", selectedCourse === course.id && "bg-white dark:bg-zinc-900 shadow-sm border-zinc-300 dark:border-zinc-700")}
            >
              {course.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Evaluations List */}
      <div className="flex flex-col gap-6">
        {filteredEvaluations.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <Swords className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500 dark:text-zinc-400">
              {enrolledCourseIds.length === 0
                ? "Kamu belum terdaftar di kelas manapun. Silakan minta akses kelas terlebih dahulu di menu Daftar Kelas."
                : "Belum ada tantangan di arena ini"}
            </p>
          </div>
        ) : (
          filteredEvaluations.map(evaluation => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              getCourseName={getCourseName}
              name={name}
              onStart={() => router.push(`/evaluation/${evaluation.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Card Component with Warning Modal ──────────────────────────────────────
function EvaluationCard({ evaluation, getCourseName, onStart, name }: {
  evaluation: typeof SAMPLE_EVALUATIONS[0];
  getCourseName: (id: string) => string;
  onStart: () => void;
  name: string;
}) {
  const [showWarning, setShowWarning] = useState(false);

  // Styling based on status
  const isCompleted = !evaluation.isActive;
  
  if (isCompleted) {
    return (
      <Card className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-950/80 shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30">
          <span className="px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
            {getCourseName(evaluation.courseId)}
          </span>
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Selesai
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{evaluation.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-emerald-100/60 mb-6">{evaluation.description}</p>

          {/* Results block */}
          <div className="flex flex-col md:flex-row bg-emerald-50/50 dark:bg-slate-900/50 rounded-xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden mb-6">
            <div className="flex-[1.5] p-5 md:border-r border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium mb-2 uppercase tracking-widest">Skor kamu</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">95 / 110</span>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-600 font-bold mt-1">poin</p>
            </div>
            
            <div className="flex-1 p-5 border-t md:border-t-0 md:border-r border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium mb-2 uppercase tracking-widest">Posisi akhir</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-orange-500 dark:text-orange-400">#2</span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-500/80 mt-1 font-medium">dari 12 peserta</p>
            </div>

            <div className="flex-[1.2] p-5 border-t md:border-t-0 border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium mb-2 uppercase tracking-widest">Peringkat 1</p>
              <p className="text-base font-bold text-orange-500 dark:text-orange-400 truncate">Aldi R.</p>
              <p className="text-sm text-orange-600 dark:text-orange-500/80 mt-1 font-medium">110 / 110</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-6">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-emerald-100/80">
              <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm">10</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-500/80">soal</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-emerald-100/80">
              <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm">110</span>
                <span className="text-[10px] uppercase tracking-wider text-yellow-600 dark:text-yellow-500/80">poin</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-emerald-100/80">
              <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm">30</span>
                <span className="text-[10px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400/80">menit</span>
              </div>
            </div>
          </div>

          <Link href={`/evaluation/${evaluation.id}/results`} className="block">
            <Button className="w-full bg-white dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-white font-bold h-12 rounded-xl transition-all shadow-md">
              <PlayCircle className="w-4 h-4 mr-2" /> Lihat Hasil Lengkap
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Active state
  return (
    <>
      <Card className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40">
          <span className="px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
            {getCourseName(evaluation.courseId)}
          </span>
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Berlangsung sekarang
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{evaluation.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-indigo-100/60 mb-6">{evaluation.description}</p>

          {/* Versus block */}
          <div className="flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden mb-6">
            <div className="flex-1 p-5 md:border-r border-indigo-100 dark:border-indigo-900/40">
              <p className="text-xs text-indigo-500 dark:text-indigo-400/80 font-medium mb-1 uppercase tracking-widest">Kamu</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white truncate">{name}</p>
              <p className="text-sm text-zinc-500 dark:text-indigo-300/60 mt-1 font-medium">Belum mulai</p>
            </div>
            <div className="flex-1 p-5 border-t md:border-t-0 border-indigo-100 dark:border-indigo-900/40 bg-zinc-100/50 dark:bg-slate-900/40">
              <p className="text-xs text-indigo-500 dark:text-indigo-400/80 font-medium mb-1 uppercase tracking-widest">Lawan terkuat</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white truncate">Aldi R.</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 font-medium">#1 minggu ini</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-6">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-indigo-100/80 text-sm font-bold">
              <ClipboardCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>{evaluation.questions.length} soal</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-indigo-100/80 text-sm font-bold">
              <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              <span>{evaluation.totalPoints} poin</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-indigo-100/80 text-sm font-bold">
              <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span>{evaluation.duration} menit</span>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex -space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white relative z-40">AR</div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white relative z-30">BK</div>
              <div className="w-8 h-8 rounded-full bg-orange-600 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white relative z-20">CL</div>
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white relative z-10">DM</div>
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-indigo-300/80">+8 peserta aktif</span>
          </div>

          <Button onClick={() => setShowWarning(true)} className="w-full bg-white dark:bg-slate-950 text-indigo-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 font-bold h-12 rounded-xl transition-all shadow-md">
            <Swords className="w-4 h-4 mr-2" /> Masuk Arena
          </Button>
        </div>
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
              Sebelum Masuk Arena...
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-2xl h-12 text-base shadow-lg shadow-indigo-500/25 text-white"
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
