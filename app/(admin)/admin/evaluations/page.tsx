"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { SAMPLE_EVALUATIONS } from '@/lib/evaluation-data';
import { MOCK_EVALUATION_RESULTS } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  Plus,
  Users,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Edit,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EvaluationsPage() {
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
              Manajemen Evaluasi
            </h1>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Buat Evaluasi Baru
          </Button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Kelola dan pantau semua evaluasi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 rounded-xl border-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Evaluasi</div>
          <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {SAMPLE_EVALUATIONS.length}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Evaluasi Aktif</div>
          <div className="text-2xl font-bold text-green-600">
            {SAMPLE_EVALUATIONS.filter(e => e.isActive).length}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border-2">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Submission</div>
          <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {MOCK_EVALUATION_RESULTS.length}
          </div>
        </Card>
      </div>

      {/* Evaluations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_EVALUATIONS.map((evaluation) => {
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
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
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
                <Button 
                  variant="outline" 
                  className="flex-1 font-bold"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Hasil
                </Button>
                {evaluation.isActive && (
                  <Button 
                    variant="outline" 
                    className="flex-1 font-bold text-red-600 hover:text-red-700"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Tutup
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {SAMPLE_EVALUATIONS.length === 0 && (
        <div className="text-center py-12">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Belum ada evaluasi
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Buat Evaluasi Pertama
          </Button>
        </div>
      )}
    </div>
  );
}
