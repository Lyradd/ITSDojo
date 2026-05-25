"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEvaluationById, getAllResultsForEvaluation } from "@/actions/evaluations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  Trophy,
  Target,
  User,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EvalRow = {
  id: number;
  evaluationId: string;
  studentId: string;
  score: number;
  accuracy: number;
  timeSpent: number;
  completedAt: Date | string;
  studentName: string;
  studentAvatar: string | null;
};

type EvalRecord = {
  id: string;
  title: string;
  description: string;
  totalPoints: number;
  questions: any;
};

export default function DetailedResultsPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [evaluation, setEvaluation] = useState<EvalRecord | null>(null);
  const [results, setResults] = useState<EvalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [evalData, resultRows] = await Promise.all([
        getEvaluationById(evaluationId),
        getAllResultsForEvaluation(evaluationId),
      ]);
      if (cancelled) return;
      setEvaluation(evalData as EvalRecord | null);
      setResults(resultRows as EvalRow[]);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500">Memuat hasil evaluasi...</div>
    );
  }

  if (!evaluation) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Evaluasi tidak ditemukan</p>
        <Button onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const totalPoints = evaluation.totalPoints || 100;
  const submissionsCount = results.length;

  // Skor di evaluation_results adalah poin absolut (bukan persen).
  // Untuk konsistensi, kita konversi ke persen relatif terhadap totalPoints saat menampilkan.
  const toPercent = (score: number) =>
    totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  const avgScore = submissionsCount > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / submissionsCount)
    : 0;
  const avgPercent = toPercent(avgScore);
  const maxScore = submissionsCount > 0 ? Math.max(...results.map((r) => r.score)) : 0;
  const passCount = results.filter((r) => toPercent(r.score) >= 60).length;
  const passRate = submissionsCount > 0 ? Math.round((passCount / submissionsCount) * 100) : 0;

  const distribution = [
    { range: '90-100', count: results.filter((r) => toPercent(r.score) >= 90).length, color: 'bg-green-600' },
    { range: '80-89', count: results.filter((r) => toPercent(r.score) >= 80 && toPercent(r.score) < 90).length, color: 'bg-blue-600' },
    { range: '70-79', count: results.filter((r) => toPercent(r.score) >= 70 && toPercent(r.score) < 80).length, color: 'bg-yellow-600' },
    { range: '60-69', count: results.filter((r) => toPercent(r.score) >= 60 && toPercent(r.score) < 70).length, color: 'bg-orange-600' },
    { range: '0-59', count: results.filter((r) => toPercent(r.score) < 60).length, color: 'bg-red-600' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-2">
                Hasil: {evaluation.title}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {submissionsCount} mahasiswa telah submit
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{submissionsCount}</div>
                <div className="text-sm text-zinc-500">Total Submission</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{avgPercent}%</div>
                <div className="text-sm text-zinc-500">Rata-rata Skor</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{passRate}%</div>
                <div className="text-sm text-zinc-500">Pass Rate (≥60%)</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{toPercent(maxScore)}%</div>
                <div className="text-sm text-zinc-500">Skor Tertinggi</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Distribution */}
        {submissionsCount > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Distribusi Skor</h3>
            <div className="space-y-2">
              {distribution.map((item) => (
                <div key={item.range} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-semibold">{item.range}%</div>
                  <div className="flex-1 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden">
                    <div
                      className={cn("h-full transition-all", item.color)}
                      style={{ width: `${(item.count / submissionsCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-zinc-600">{item.count}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Submissions List */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Daftar Submission</h3>
          {results.length === 0 ? (
            <p className="text-zinc-500 text-sm py-8 text-center">Belum ada mahasiswa yang submit.</p>
          ) : (
            <div className="space-y-2">
              {results.map((row, idx) => (
                <div
                  key={row.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2",
                    idx === 0 && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800",
                    idx === 1 && "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
                    idx === 2 && "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
                    idx > 2 && "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      idx === 0 && "bg-yellow-500 text-white",
                      idx === 1 && "bg-zinc-400 text-white",
                      idx === 2 && "bg-orange-500 text-white",
                      idx > 2 && "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {idx + 1}
                  </div>

                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0", row.studentAvatar || 'bg-blue-200 text-blue-700')}>
                    {row.studentName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate">
                      {row.studentName}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(row.timeSpent / 60)}m {row.timeSpent % 60}s
                      </span>
                      <span>Akurasi: {row.accuracy}%</span>
                      <span>{new Date(row.completedAt).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{toPercent(row.score)}%</div>
                    <div className="text-xs text-zinc-500">{row.score}/{totalPoints} poin</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
