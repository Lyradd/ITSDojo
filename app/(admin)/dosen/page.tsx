"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { MOCK_STUDENTS, MOCK_ACTIVITY_LOGS, MOCK_ANALYTICS } from '@/lib/admin-data';
import { SAMPLE_EVALUATIONS } from '@/lib/evaluation-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  ClipboardCheck, 
  Activity,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Plus,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DosenDashboardPage() {
  const router = useRouter();
  const { role, name } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Redirect if not dosen
    if (isMounted && role !== 'dosen') {
      if (role === 'admin') router.push('/admin');
      else if (role === 'asdos') router.push('/asdos');
      else router.push('/learn');
    }
  }, [isMounted, role, router]);

  if (!isMounted || role !== 'dosen') return null;

  const stats = {
    totalStudents: MOCK_STUDENTS.length,
    activeToday: MOCK_STUDENTS.filter(s => s.lastActive.includes('hour') || s.lastActive.includes('minute')).length,
    averageScore: Math.round(MOCK_STUDENTS.reduce((acc, s) => acc + s.accuracy, 0) / MOCK_STUDENTS.length),
    activeEvaluations: SAMPLE_EVALUATIONS.filter(e => e.isActive).length,
  };

  const recentActivities = MOCK_ACTIVITY_LOGS.slice(0, 5);
  const activeEvaluations = SAMPLE_EVALUATIONS.filter(e => e.isActive);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Dashboard Dosen
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Selamat datang kembali, <span className="font-bold text-blue-600">{name}</span> 👋
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { gradient: 'from-blue-500 to-blue-600', icon: <Users className="w-6 h-6" />, value: stats.totalStudents, label: 'Total Mahasiswa', textColor: 'text-blue-100' },
            { gradient: 'from-green-500 to-emerald-600', icon: <Activity className="w-6 h-6" />, value: stats.activeToday, label: 'Aktif Hari Ini', textColor: 'text-green-100' },
            { gradient: 'from-purple-500 to-pink-600', icon: <Target className="w-6 h-6" />, value: `${stats.averageScore}%`, label: 'Rata-rata Akurasi', textColor: 'text-purple-100' },
            { gradient: 'from-orange-500 to-red-600', icon: <ClipboardCheck className="w-6 h-6" />, value: stats.activeEvaluations, label: 'Evaluasi Aktif', textColor: 'text-orange-100' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`p-6 rounded-2xl border-2 bg-linear-to-br ${stat.gradient} text-white shadow-lg`}>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mb-4">{stat.icon}</div>
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <div className={`text-sm ${stat.textColor}`}>{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/dosen/courses">
            <Card className="p-6 rounded-2xl border-2 hover:border-blue-400 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">Kelola Kursus</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Tambah & edit materi</div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/dosen/evaluations">
            <Card className="p-6 rounded-2xl border-2 hover:border-purple-400 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">Buat Evaluasi</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Quiz & assessment</div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-600 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/dosen/analytics">
            <Card className="p-6 rounded-2xl border-2 hover:border-green-400 transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">Analytics</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Reports</div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-green-600 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/dosen/leaderboard">
            <Card className="p-6 rounded-2xl border-2 hover:border-yellow-400 transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-zinc-800 dark:text-zinc-100">Leaderboard</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Peringkat</div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-yellow-600 transition-all" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6 rounded-2xl border-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Aktivitas Terbaru
                </h3>
                <Link href="/dosen/students">
                  <Button variant="outline" size="sm" className="font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">
                    Lihat Semua
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const getIcon = () => {
                    if (activity.action === 'completed_evaluation') return <CheckCircle className="w-5 h-5 text-green-600" />;
                    if (activity.action === 'started_course') return <Activity className="w-5 h-5 text-blue-600" />;
                    if (activity.action === 'level_up') return <Award className="w-5 h-5 text-purple-600" />;
                    return <Clock className="w-5 h-5 text-zinc-400" />;
                  };

                  const timeAgo = new Date(activity.timestamp).toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  return (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-linear-to-r from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 hover:shadow-md transition-all duration-300 border border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
                          {activity.studentName}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                          {activity.details}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {timeAgo}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Active Evaluations */}
          <div>
            <Card className="p-6 rounded-2xl border-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" fill="currentColor" />
                  Evaluasi Aktif
                </h3>
              </div>

              <div className="space-y-3">
                {activeEvaluations.map((evaluation) => (
                  <Link 
                    key={evaluation.id}
                    href={`/evaluation/${evaluation.id}`}
                    className="block p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300 bg-linear-to-br from-white to-orange-50 dark:from-zinc-900 dark:to-orange-950/20 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                        {evaluation.title}
                      </div>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        AKTIF
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                      {evaluation.questions.length} soal • {evaluation.duration} menit
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <Users className="w-3 h-3" />
                        <span>12 submission</span>
                      </div>
                      <div className="text-[10px] font-bold text-orange-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Buka Ruang <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                ))}

                <Link href="/dosen/evaluations">
                  <Button className="w-full bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-bold shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Evaluasi Baru
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 rounded-2xl border-2 bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Completion Rate</span>
                  <span className="font-bold text-blue-600">{MOCK_ANALYTICS.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Submissions</span>
                  <span className="font-bold text-purple-600">{MOCK_ANALYTICS.totalSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Avg Score</span>
                  <span className="font-bold text-green-600">{MOCK_ANALYTICS.averageScore}%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
