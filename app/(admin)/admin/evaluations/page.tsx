"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import {
  getAllEvaluations,
  getEvaluationStats,
  finishEvaluationSession,
  reopenEvaluationSession,
  deleteEvaluation,
  duplicateEvaluation,
} from '@/actions/evaluations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardCheck,
  Plus,
  Users,
  Clock,
  Target,
  Edit,
  Eye,
  Trash2,
  Copy,
  Search,
  Power,
  PowerOff,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlowCard } from '@/components/ui/glow-card';

type EvaluationRow = {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalPoints: number;
  isActive: boolean;
  questions: any;
  courseId: string;
};

export default function EvaluationsPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const isAsdos = role === 'asdos';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [stats, setStats] = useState<{
    totalParticipants: number;
    avgAccuracy: number;
    perEvaluationParticipants: Record<string, number>;
  }>({ totalParticipants: 0, avgAccuracy: 0, perEvaluationParticipants: {} });

  const loadData = async () => {
    const [data, statsData] = await Promise.all([
      getAllEvaluations(),
      getEvaluationStats(),
    ]);
    setEvaluations(data as EvaluationRow[]);
    setStats(statsData);
  };

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  if (!isMounted) return null;

  const getSubmissionCount = (evalId: string) => stats.perEvaluationParticipants[evalId] ?? 0;

  const handleDelete = async (evalId: string, evalTitle: string) => {
    if (!confirm(`Yakin ingin menghapus "${evalTitle}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await deleteEvaluation(evalId);
    if (res.success) {
      toast.success('Evaluasi berhasil dihapus');
      loadData();
    } else {
      toast.error('Gagal menghapus evaluasi');
    }
  };

  const handleDuplicate = async (evalId: string) => {
    const res = await duplicateEvaluation(evalId);
    if (res.success) {
      toast.success('Evaluasi berhasil diduplikasi');
      loadData();
    } else {
      toast.error('Gagal menduplikasi evaluasi');
    }
  };

  const handleToggleActive = async (evaluation: EvaluationRow) => {
    const res = evaluation.isActive
      ? await finishEvaluationSession(evaluation.id)
      : await reopenEvaluationSession(evaluation.id);
    if (res.success) {
      toast.success(evaluation.isActive ? 'Evaluasi ditutup' : 'Evaluasi diaktifkan');
      loadData();
    } else {
      toast.error('Gagal mengubah status');
    }
  };

  // Filtered & searched evaluations
  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         evaluation.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && evaluation.isActive) ||
                         (statusFilter === 'inactive' && !evaluation.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalSubmissions = Object.values(stats.perEvaluationParticipants).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-blue-700 dark:text-white">
              {isAsdos ? 'Monitoring Evaluasi' : 'Manajemen Evaluasi'}
            </h1>
          </div>
          {!isAsdos && (
            <Link href="/admin/evaluations/create">
              <Button className="bg-purple-600 hover:bg-purple-700 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Buat Evaluasi Baru
              </Button>
            </Link>
          )}
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {isAsdos ? 'Pantau semua evaluasi' : 'Kelola dan pantau semua evaluasi'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 rounded-xl border-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Evaluasi</div>
          <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {evaluations.length}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Evaluasi Aktif</div>
          <div className="text-2xl font-bold text-green-600">
            {evaluations.filter(e => e.isActive).length}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Submission</div>
          <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {totalSubmissions}
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Cari berdasarkan judul atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            Semua
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            size="sm"
            className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Aktif
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('inactive')}
            size="sm"
            className={statusFilter === 'inactive' ? 'bg-zinc-600 hover:bg-zinc-700' : ''}
          >
            Selesai
          </Button>
        </div>
      </div>

      <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Menampilkan {filteredEvaluations.length} dari {evaluations.length} evaluasi
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvaluations.map((evaluation) => {
          const submissionCount = getSubmissionCount(evaluation.id);
          const questionsLength = Array.isArray(evaluation.questions) ? evaluation.questions.length : 0;

          return (
            <GlowCard key={evaluation.id} active={evaluation.isActive} color="green">
              <Card className="p-6 rounded-2xl border-2 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    evaluation.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}>
                    {evaluation.isActive ? '🟢 AKTIF' : '⚫ SELESAI'}
                  </span>
                  <div className="flex gap-1">
                    {!isAsdos && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/admin/evaluations/${evaluation.id}/edit`)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDuplicate(evaluation.id)}
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(evaluation.id, evaluation.title)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                  {evaluation.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                  {evaluation.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Target className="w-4 h-4" />
                    <span>{questionsLength} soal • {evaluation.totalPoints} poin</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-4 h-4" />
                    <span>{evaluation.duration} menit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>{submissionCount} submission</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 font-bold",
                      evaluation.isActive
                        ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        : "text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                    )}
                    size="sm"
                    onClick={() => router.push(evaluation.isActive ? `/admin/evaluations/${evaluation.id}/monitor` : `/admin/evaluations/${evaluation.id}/results`)}
                  >
                    {evaluation.isActive ? (
                      <>
                        <Activity className="w-4 h-4 mr-2" />
                        Monitor Live
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat Hasil
                      </>
                    )}
                  </Button>

                  {!isAsdos && (
                    <Button
                      variant="outline"
                      className={cn(
                        "font-bold",
                        evaluation.isActive
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      )}
                      size="sm"
                      onClick={() => handleToggleActive(evaluation)}
                      title={evaluation.isActive ? 'Tutup' : 'Aktifkan'}
                    >
                      {evaluation.isActive ? (
                        <><PowerOff className="w-4 h-4 mr-2" /> Tutup</>
                      ) : (
                        <><Power className="w-4 h-4 mr-2" /> Aktifkan</>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            </GlowCard>
          );
        })}
      </div>

      {filteredEvaluations.length === 0 && evaluations.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            Tidak ada evaluasi yang cocok
          </p>
          <p className="text-sm text-zinc-400">
            Coba ubah pencarian atau filter
          </p>
        </div>
      )}

      {evaluations.length === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Belum ada evaluasi
          </p>
          {!isAsdos && (
            <Link href="/admin/evaluations/create">
              <Button className="bg-purple-600 hover:bg-purple-700 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Buat Evaluasi Pertama
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
