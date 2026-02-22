"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { SAMPLE_EVALUATIONS } from '@/lib/evaluation-data';
import { MOCK_EVALUATION_RESULTS } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ClipboardCheck, 
  Plus,
  Users,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Trash2,
  Copy,
  Search,
  Filter,
  Power,
  PowerOff,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EvaluationsPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const isAsdos = role === 'asdos';
  
  // State for search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Local evaluations state (for delete/toggle without backend)
  const [evaluations, setEvaluations] = useState(SAMPLE_EVALUATIONS);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const getSubmissionCount = (evalId: string) => {
    return MOCK_EVALUATION_RESULTS.filter(r => r.evaluationId === evalId).length;
  };

  const getAverageScore = (evalId: string) => {
    const results = MOCK_EVALUATION_RESULTS.filter(r => r.evaluationId === evalId);
    if (results.length === 0) return 0;
    return Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length);
  };

  // Delete evaluation
  const handleDelete = (evalId: string, evalTitle: string) => {
    if (confirm(`Are you sure you want to delete "${evalTitle}"? This action cannot be undone.`)) {
      setEvaluations(evaluations.filter(e => e.id !== evalId));
      alert('Evaluation deleted successfully!');
    }
  };

  // Duplicate evaluation
  const handleDuplicate = (evaluation: any) => {
    const duplicated = {
      ...evaluation,
      id: `eval_${Date.now()}`,
      title: `${evaluation.title} (Copy)`,
      isActive: false,
    };
    setEvaluations([...evaluations, duplicated]);
    alert(`Evaluation duplicated: ${duplicated.title}`);
  };

  // Toggle activate/deactivate
  const handleToggleActive = (evalId: string) => {
    setEvaluations(evaluations.map(e => 
      e.id === evalId ? { ...e, isActive: !e.isActive } : e
    ));
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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
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
            {MOCK_EVALUATION_RESULTS.length}
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter by Status */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            size="sm"
            className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('inactive')}
            size="sm"
            className={statusFilter === 'inactive' ? 'bg-zinc-600 hover:bg-zinc-700' : ''}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Showing {filteredEvaluations.length} of {evaluations.length} evaluations
      </div>

      {/* Evaluations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvaluations.map((evaluation) => {
          const submissionCount = getSubmissionCount(evaluation.id);
          const averageScore = getAverageScore(evaluation.id);

          return (
            <Card 
              key={evaluation.id}
              className="p-6 rounded-2xl border-2 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Status Badge */}
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
                        onClick={() => handleDuplicate(evaluation)}
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

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                {evaluation.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                {evaluation.description}
              </p>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Target className="w-4 h-4" />
                  <span>{evaluation.questions.length} soal • {evaluation.totalPoints} poin</span>
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

              {/* Average Score */}
              {submissionCount > 0 && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Rata-rata Score:
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {averageScore}%
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {/* Smart button: Monitor Live (active) or Lihat Hasil (inactive) */}
                <Button 
                  variant="outline" 
                  className={cn(
                    "flex-1 font-bold",
                    evaluation.isActive 
                      ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                      : "text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  )}
                  size="sm"
                  onClick={() => router.push(`/admin/evaluations/${evaluation.id}/monitor`)}
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
                
                {/* Activate/Deactivate Toggle - Dosen only */}
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
                    onClick={() => handleToggleActive(evaluation.id)}
                    title={evaluation.isActive ? 'Deactivate' : 'Activate'}
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
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvaluations.length === 0 && evaluations.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            No evaluations found
          </p>
          <p className="text-sm text-zinc-400">
            Try adjusting your search or filter
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
