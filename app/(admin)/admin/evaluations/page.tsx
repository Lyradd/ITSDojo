"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { getActiveEvaluations, finishEvaluationSession, getEvaluationStats } from '@/actions/evaluations';
import { getAllCourses } from '@/actions/courses';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  Clock,
  Target,
  Users,
  Eye,
  CheckCircle2,
  Swords,
  Plus,
  Settings,
  MoreVertical,
  Activity,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminEvaluationsPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<{ id: string; title: string }[]>([]);
  const [stats, setStats] = useState<{
    totalParticipants: number;
    avgAccuracy: number;
    perEvaluationParticipants: Record<string, number>;
  }>({ totalParticipants: 0, avgAccuracy: 0, perEvaluationParticipants: {} });

  const loadEvals = async () => {
    const [data, statsData, courses] = await Promise.all([
      getActiveEvaluations(),
      getEvaluationStats(),
      getAllCourses(),
    ]);
    setEvaluationsList(data);
    setStats(statsData);
    setCoursesList(courses);
  };

  useEffect(() => {
    setIsMounted(true);
    if (role !== 'admin') {
      if (role === 'dosen') router.push('/dosen');
      else router.push('/learn');
      return;
    }

    if (role === 'admin') {
      loadEvals();
    }
  }, [role, router]);

  if (!isMounted || role !== 'admin') return null;

  const filteredEvaluations = selectedCourse === 'all'
    ? evaluationsList
    : evaluationsList.filter((e) => e.courseId === selectedCourse);

  const getCourseName = (courseId: string) =>
    coursesList.find((c) => c.id === courseId)?.title || 'Kelas Tidak Ditemukan';

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-orange-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <Swords className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-blue-700 dark:text-white">Manajemen Arena</h1>
                <p className="text-zinc-600 dark:text-zinc-400">Atur evaluasi dan pantau pertandingan mahasiswa</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin/evaluations/create')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-500/25 px-6"
            >
              <Plus className="w-5 h-5 mr-2" /> Buat Arena Evaluasi Baru
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 rounded-2xl border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
                  {evaluationsList.filter((e) => e.isActive).length}
                </div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Arena Aktif</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-2xl border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
                  {evaluationsList.filter((e) => !e.isActive).length}
                </div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Selesai</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-2xl border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100">{stats.totalParticipants}</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Partisipan</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-2xl border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100">{stats.avgAccuracy}%</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rata-rata Akurasi</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Course Filter */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedCourse('all')}
              className={cn(
                'font-bold rounded-xl border-zinc-200 dark:border-zinc-800 whitespace-nowrap',
                selectedCourse === 'all' && 'bg-white dark:bg-zinc-900 shadow-sm border-zinc-300 dark:border-zinc-700',
              )}
            >
              Semua Kelas
            </Button>
            {coursesList.map((course) => (
              <Button
                key={course.id}
                size="sm"
                variant="outline"
                onClick={() => setSelectedCourse(course.id)}
                className={cn(
                  'font-bold rounded-xl border-zinc-200 dark:border-zinc-800 whitespace-nowrap',
                  selectedCourse === course.id && 'bg-white dark:bg-zinc-900 shadow-sm border-zinc-300 dark:border-zinc-700',
                )}
              >
                {course.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Evaluations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvaluations.map((evaluation) => (
            <AdminEvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              getCourseName={getCourseName}
              participantCount={stats.perEvaluationParticipants[evaluation.id] ?? 0}
              onClosed={loadEvals}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminEvaluationCard({
  evaluation,
  getCourseName,
  participantCount,
  onClosed,
}: {
  evaluation: any;
  getCourseName: (id: string) => string;
  participantCount: number;
  onClosed?: () => void;
}) {
  const router = useRouter();
  const isActive = evaluation.isActive;
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePantauLive = () => {
    router.push(`/admin/evaluations/${evaluation.id}/monitor`);
  };

  const handleLihatHasil = () => {
    router.push(`/admin/evaluations/${evaluation.id}/results`);
  };

  const handleEdit = () => {
    router.push(`/admin/evaluations/${evaluation.id}/edit`);
  };

  const handleConfirmClose = async () => {
    setIsClosing(true);
    const res = await finishEvaluationSession(evaluation.id);
    setIsClosing(false);
    setShowConfirm(false);
    if (res.success) {
      toast.success('Arena berhasil ditutup');
      onClosed?.();
    } else {
      toast.error('Gagal menutup arena');
    }
  };

  return (
    <Card
      className={cn(
        'rounded-3xl border-2 shadow-xl overflow-hidden flex flex-col transition-all hover:-translate-y-1',
        isActive
          ? 'border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-950'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50',
      )}
    >
      {/* Top bar */}
      <div
        className={cn(
          'px-5 py-3 flex items-center justify-between border-b',
          isActive ? 'border-indigo-100 dark:border-indigo-900/40' : 'border-zinc-200 dark:border-zinc-800',
        )}
      >
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-bold border',
            isActive
              ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800',
          )}
        >
          {getCourseName(evaluation.courseId)}
        </span>
        <div className="flex items-center gap-2">
          {isActive ? (
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Live
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Selesai
            </div>
          )}
          <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1.5 line-clamp-1">{evaluation.title}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-2">{evaluation.description}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
            <ClipboardCheck className="w-5 h-5 mx-auto mb-1 text-emerald-500 dark:text-emerald-400" />
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              {Array.isArray(evaluation.questions) ? evaluation.questions.length : 0}
            </div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">Soal</div>
          </div>
          <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-orange-500 dark:text-orange-400" />
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{participantCount}</div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">Peserta</div>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          {isActive ? (
            <>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={isClosing}
                variant="outline"
                className="flex-1 font-bold border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> {isClosing ? 'Menutup...' : 'Tutup Arena'}
              </Button>
              <Button onClick={handlePantauLive} className="flex-1 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
                <Eye className="w-4 h-4 mr-1.5" /> Pantau Live
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit} variant="outline" className="flex-1 font-bold">
                <Settings className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button onClick={handleLihatHasil} className="flex-1 font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md">
                Lihat Hasil
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Tutup Arena */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Tutup Arena?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                Mahasiswa tidak dapat lagi mengikuti evaluasi <span className="font-bold">{evaluation.title}</span> setelah ditutup. Lanjutkan?
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 font-bold rounded-xl"
                  onClick={() => setShowConfirm(false)}
                  disabled={isClosing}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 font-bold rounded-xl"
                  onClick={handleConfirmClose}
                  disabled={isClosing}
                >
                  {isClosing ? 'Menutup...' : 'Ya, Tutup'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
