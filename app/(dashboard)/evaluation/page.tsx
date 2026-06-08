"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { getActiveEvaluations, getStudentCompletedEvaluationIds } from '@/actions/evaluations';
import { getAllCourses } from '@/actions/courses';
import { getAngkatanFromSemester } from '@/lib/academic-utils';
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
  Trophy,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tutorial Steps ─────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  {
    emoji: '🏟️',
    title: 'Selamat Datang di Arena Evaluasi!',
    color: 'from-indigo-500 to-purple-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    image: null,
    points: [
      { icon: '⚔️', text: 'Arena Evaluasi adalah tempat kamu bersaing secara real-time dengan teman sekelas dalam satu sesi kuis yang dipantau langsung oleh dosen.' },
      { icon: '🎯', text: 'Kamu akan mengerjakan soal-soal pilihan ganda/isian dan melihat peringkatmu berubah langsung di Live Leaderboard di sebelah kanan layar.' },
      { icon: '⏱️', text: 'Evaluasi bersifat sinkronus — timer berjalan bersamaan untuk semua peserta. Pastikan kamu siap sebelum masuk!' },
      { icon: '🏆', text: 'Semakin cepat dan akurat menjawab, semakin tinggi posisimu di papan peringkat. Streak jawaban benar berturut-turut menambah poinmu!' },
    ],
  },
  {
    emoji: '⏳',
    title: 'Ruang Tunggu — Sambil Nunggu, Baca Fun Fact!',
    color: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    border: 'border-yellow-200 dark:border-yellow-800',
    image: '/tutorial/waiting_room.png',
    points: [
      { icon: '💡', text: '"Fun Fact Koding" di tengah layar berganti otomatis setiap 3.5 detik. Kamu juga bisa klik panah kiri/kanan untuk navigasi manual.' },
      { icon: '👥', text: 'Tombol "25 Peserta telah bergabung" bisa diklik untuk membuka daftar nama peserta yang sudah ada di ruang tunggu.' },
      { icon: '🔕', text: 'Tombol "Menunggu Dosen memulai sesi..." akan berubah menjadi tombol aktif setelah dosen menekan Mulai dari halaman monitor.' },
    ],
  },
  {
    emoji: '🔢',
    title: 'Countdown — Bersiaplah Sebelum Soal Muncul!',
    color: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    image: '/tutorial/countdown.png',
    points: [
      { icon: '⏱️', text: 'Setelah dosen menekan "Mulai Sesi Sekarang", seluruh layar mahasiswa akan menampilkan hitung mundur 5... 4... 3... 2... 1.' },
      { icon: '🧘', text: 'Gunakan 5 detik ini untuk menarik napas, fokus, dan pastikan tidak ada gangguan di sekitarmu.' },
      { icon: '🚫', text: 'Kamu tidak bisa menghentikan countdown — begitu selesai, soal pertama langsung tampil dan timer mulai berjalan.' },
    ],
  },
  {
    emoji: '📝',
    title: 'Arena — Tampilan Saat Mengerjakan Evaluasi',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    image: '/tutorial/quiz_initial.png',
    points: [
      { icon: '📋', text: 'Navigasi Soal (kiri): nomor berwarna biru (soal aktif), hijau (benar), merah (salah), abu-abu gelap (belum dijawab).' },
      { icon: '📊', text: 'Stats Bar (atas): Menampilkan persentase soal terjawab, total poin, akurasi, sisa waktu, dan tombol streak.' },
      { icon: '🔥', text: 'Streak (atas tengah): Menyala jika kamu berhasil menjawab soal berturut-turut dengan benar.' },
      { icon: '🏅', text: 'Live Leaderboard (kanan): Menampilkan peringkat real-time peserta. Hijau (akurasi tinggi), kuning (sedang), merah (rendah).' },
    ],
  },
  {
    emoji: '🎊',
    title: 'Hasil Akhir — Evaluasi Selesai!',
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    border: 'border-pink-200 dark:border-pink-800',
    image: '/tutorial/results.png',
    points: [
      { icon: '🏁', text: 'Setelah evaluasi selesai, halaman ini akan menampilkan Total Poin, Akurasi (%), Peringkat akhirmu, dan jumlah soal terjawab.' },
      { icon: '📋', text: 'Ringkasan Jawaban (kiri bawah): Menampilkan detail soal-soal mana yang dijawab benar (hijau) dan salah (merah).' },
      { icon: '🥇', text: 'Live Leaderboard (kanan): Menampilkan peringkat final untuk seluruh peserta.' },
      { icon: '🎉', text: 'Akan ada perayaan konfeti bergantung pada seberapa tinggi akurasimu!' },
    ],
  },
];

export default function EvaluationPage() {
  const router = useRouter();
  const { isLoggedIn, semester, name, id: userId } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Triggering Next.js Fast Refresh to reload the TUTORIAL_STEPS data correctly
  useEffect(() => { setIsMounted(true); }, []);

  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<{ id: string; title: string; requiredSemester: number }[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [globalRank, setGlobalRank] = useState<{rank: number | null, totalUsers: number}>({ rank: null, totalUsers: 0 });

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/login');
      return;
    }

    if (isMounted && isLoggedIn) {
      (async () => {
        const [data, courses, completed, rankInfo] = await Promise.all([
          getActiveEvaluations(),
          getAllCourses(),
          getStudentCompletedEvaluationIds(userId),
          import('@/actions/leaderboard').then(m => m.getUserGlobalRank(userId, semester))
        ]);
        setEvaluationsList(data);
        setCoursesList(courses);
        setCompletedIds(completed);
        setGlobalRank(rankInfo);
      })();
    }
  }, [isLoggedIn, router, isMounted, userId]);

  if (!isMounted || !isLoggedIn) return null;

  // Filter evaluasi berdasarkan semester user — kursus yang requiredSemester ≤ semester user
  // otomatis bisa diakses (tidak perlu enrollment).
  const accessibleCourseIds = coursesList
    .filter((c) => c.requiredSemester <= semester)
    .map((c) => c.id);
  const enrolledEvaluations = evaluationsList.filter((e) => accessibleCourseIds.includes(e.courseId));
  const filteredEvaluations = selectedCourse === 'all'
    ? enrolledEvaluations
    : enrolledEvaluations.filter(e => e.courseId === selectedCourse);

  const getCourseName = (courseId: string) => coursesList.find(c => c.id === courseId)?.title || 'Kelas Tidak Ditemukan';
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div>
              <Swords className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Arena Evaluasi</h1>
              <p className="text-zinc-600 dark:text-zinc-400">Adu kemampuan, raih posisi teratas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 font-bold text-sm flex items-center shadow-md">
              <Trophy className="w-4 h-4 mr-2" />
              {globalRank.rank ? `Peringkat #${globalRank.rank} dari ${globalRank.totalUsers} (${getAngkatanFromSemester(semester)})` : 'Belum ada peringkat'}
            </div>
            <button
              onClick={() => { setTutorialStep(0); setShowTutorial(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              Cara Pakai Arena
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTutorial(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-3xl w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 my-4"
            >
              {/* Gradient header */}
              <div className={cn('bg-gradient-to-r p-5 text-white', TUTORIAL_STEPS[tutorialStep].color)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                    Langkah {tutorialStep + 1} / {TUTORIAL_STEPS.length}
                  </span>
                  <button onClick={() => setShowTutorial(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{TUTORIAL_STEPS[tutorialStep].emoji}</div>
                  <h3 className="text-xl font-black leading-tight">{TUTORIAL_STEPS[tutorialStep].title}</h3>
                </div>
              </div>

              {/* Screenshot */}
              {TUTORIAL_STEPS[tutorialStep].image && (
                <div className="relative bg-zinc-950 border-b border-zinc-800 overflow-hidden flex justify-center">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={tutorialStep + '-img'}
                      src={TUTORIAL_STEPS[tutorialStep].image!}
                      alt={TUTORIAL_STEPS[tutorialStep].title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full object-cover max-h-[380px] object-top"
                    />
                  </AnimatePresence>
                </div>
              )}

              {/* Content */}
              <div className={cn('p-5', TUTORIAL_STEPS[tutorialStep].bg)}>
                <div className={cn('rounded-2xl border p-4 space-y-3', TUTORIAL_STEPS[tutorialStep].border, 'bg-white/70 dark:bg-zinc-900/70')}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tutorialStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-2.5"
                    >
                      {TUTORIAL_STEPS[tutorialStep].points.map((point, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-xl leading-none mt-0.5 shrink-0">{point.icon}</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{point.text}</p>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTutorialStep(i)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        i === tutorialStep ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-300 dark:bg-zinc-600 hover:bg-indigo-300'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Nav buttons */}
              <div className="px-5 pb-5 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setTutorialStep(s => Math.max(0, s - 1))}
                  disabled={tutorialStep === 0}
                  className="flex-1 rounded-2xl font-bold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
                </Button>
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <Button
                    onClick={() => setTutorialStep(s => s + 1)}
                    className="flex-1 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowTutorial(false)}
                    className="flex-1 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    🚀 Siap Bertarung!
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedCourse('all')} 
            className={cn("font-bold rounded-xl border-zinc-200 dark:border-zinc-800", selectedCourse === 'all' && "bg-white dark:bg-zinc-900 shadow-sm border-zinc-300 dark:border-zinc-700")}
          >
            Semua Kelas
          </Button>
          {coursesList.filter(c => accessibleCourseIds.includes(c.id)).map(course => (
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
              {accessibleCourseIds.length === 0
                ? `Belum ada kelas tersedia untuk semester ${semester}. Hubungi admin jika ini tidak sesuai.`
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
              userId={userId}
              isCompletedByStudent={completedIds.includes(evaluation.id)}
              onStart={() => router.push(`/evaluation/${evaluation.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Card Component with Warning Modal ──────────────────────────────────────
function EvaluationCard({ evaluation, getCourseName, onStart, name, userId, isCompletedByStudent }: {
  evaluation: any;
  getCourseName: (id: string) => string;
  onStart: () => void;
  name: string;
  userId: string;
  isCompletedByStudent?: boolean;
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    import('@/actions/evaluations').then(({ getArenaStatsForEvaluation }) => {
      getArenaStatsForEvaluation(evaluation.id, userId).then(res => {
        if (res.success) setStats(res);
      });
    });
  }, [evaluation.id, userId]);

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
                <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.myScore ?? 0} / {evaluation.totalPoints}</span>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-600 font-bold mt-1">poin</p>
            </div>
            
            <div className="flex-1 p-5 border-t md:border-t-0 md:border-r border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium mb-2 uppercase tracking-widest">Posisi akhir</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-orange-500 dark:text-orange-400">#{stats?.rank ?? '-'}</span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-500/80 mt-1 font-medium">dari {stats?.totalParticipants ?? 0} peserta</p>
            </div>

            <div className="flex-[1.2] p-5 border-t md:border-t-0 border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 font-medium mb-2 uppercase tracking-widest">Peringkat 1</p>
              <p className="text-base font-bold text-orange-500 dark:text-orange-400 truncate">{stats?.highestScorer ?? 'Belum ada'}</p>
              <p className="text-sm text-orange-600 dark:text-orange-500/80 mt-1 font-medium">{stats?.highestScore !== -1 && stats?.highestScore !== undefined ? stats.highestScore : '-'} / {evaluation.totalPoints}</p>
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
              <p className={cn("text-sm mt-1 font-medium", isCompletedByStudent ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-indigo-300/60")}>
                {isCompletedByStudent ? "Sudah Mengerjakan" : "Belum mulai"}
              </p>
            </div>
            <div className="flex-1 p-5 border-t md:border-t-0 border-indigo-100 dark:border-indigo-900/40 bg-zinc-100/50 dark:bg-slate-900/40">
              <p className="text-xs text-indigo-500 dark:text-indigo-400/80 font-medium mb-1 uppercase tracking-widest">Skor Tertinggi Sementara</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white truncate">{stats?.highestScorer ?? 'Belum ada'}</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 font-medium">{stats?.highestScore !== -1 && stats?.highestScore !== undefined ? `${stats.highestScore} poin` : '-'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-6">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-indigo-100/80 text-sm font-bold">
              <ClipboardCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>{Array.isArray(evaluation.questions) ? evaluation.questions.length : 0} soal</span>
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
              {stats?.avatars?.length > 0 ? (
                stats.avatars.map((a: any, i: number) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white relative`} style={{ zIndex: 40 - i, backgroundColor: ['#2563eb', '#059669', '#ea580c', '#3b82f6'][i % 4] }}>
                    {a.initials}
                  </div>
                ))
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-zinc-500 relative z-40">?</div>
              )}
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-indigo-300/80">{stats?.activeCount > 0 ? `${stats.activeCount} peserta aktif` : 'Belum ada peserta'}</span>
          </div>

          {!isCompletedByStudent ? (
            <Button onClick={() => setShowWarning(true)} className="w-full bg-white dark:bg-slate-950 text-indigo-700 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 font-bold h-12 rounded-xl transition-all shadow-md">
              <Swords className="w-4 h-4 mr-2" /> Masuk Arena
            </Button>
          ) : (
            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 font-bold h-12 rounded-xl flex items-center justify-center shadow-inner opacity-80 cursor-not-allowed">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Kamu Sudah Menyelesaikan Tantangan Ini
            </div>
          )}
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
              <p>🔒 <strong>Akses 1x Saja:</strong> Pastikan koneksimu stabil. Setelah di-submit, kamu tidak bisa masuk kembali ke arena ini.</p>
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
