"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { getAllStudents } from '@/actions/students';
import { getActiveEvaluations, getEvaluationStats, getRecentActivities } from '@/actions/evaluations';
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
  Award,
  LayoutDashboard,
  Swords
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function DosenDashboardPage() {
  const router = useRouter();
  const { role, name } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    totalSubmissions: 0,
    activeEvaluations: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activeEvaluations, setActiveEvaluations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    completionRate: 0,
    totalSubmissions: 0,
    averageScore: 0,
  });

  useEffect(() => {
    setIsMounted(true);
    // Redirect if not dosen
    if (role !== 'dosen' && (role as string) !== '') {
      if (role === 'admin') router.push('/admin');
      else router.push('/learn');
    } else if (role === 'dosen') {
      const loadData = async () => {
        const [students, activeEvals, evalStats, recentLogs] = await Promise.all([
          getAllStudents(),
          getActiveEvaluations(),
          getEvaluationStats(),
          getRecentActivities(5)
        ]);

        const activeTodayCount = students.filter(s => {
          const last = typeof s.lastActiveAt === 'string' ? new Date(s.lastActiveAt) : s.lastActiveAt;
          return Date.now() - last.getTime() < 24 * 60 * 60 * 1000;
        }).length;

        const totalSubs = Object.values(evalStats.perEvaluationParticipants).reduce((acc: number, val: any) => acc + val, 0) as number;

        setStats({
          totalStudents: students.length,
          activeToday: activeTodayCount,
          totalSubmissions: totalSubs,
          activeEvaluations: activeEvals.length,
        });

        setActiveEvaluations(activeEvals);
        setRecentActivities(recentLogs);

        // Use real stats for analytics
        const evalCount = activeEvals.length || 1; // avoid div 0
        const expectedSubmissions = students.length * evalCount;
        const completionRate = expectedSubmissions > 0 ? Math.min(100, Math.round((totalSubs / expectedSubmissions) * 100)) : 0;

        setAnalytics({
          completionRate,
          totalSubmissions: totalSubs,
          averageScore: evalStats.avgAccuracy,
        });
      };

      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [role, router]);

  if (!isMounted || role !== 'dosen') return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-blue-700 dark:text-white">
                Dashboard Dosen
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Selamat datang kembali, <span className="font-bold text-blue-600">{name}</span> 👋
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { color: 'blue', icon: <Users className="w-5 h-5" />, value: stats.totalStudents, label: 'Total Mahasiswa' },
            { color: 'green', icon: <Activity className="w-5 h-5" />, value: stats.activeToday, label: 'Aktif Hari Ini' },
            { color: 'purple', icon: <CheckCircle className="w-5 h-5" />, value: stats.totalSubmissions, label: 'Total Submisi' },
            { color: 'orange', icon: <ClipboardCheck className="w-5 h-5" />, value: stats.activeEvaluations, label: 'Evaluasi Aktif' },
          ].map((stat, i) => {
            const colors: any = {
              blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-zinc-500 dark:text-slate-400">{stat.label}</div>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colors[stat.color]}`}>
                      {stat.icon}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/dosen/courses">
            <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col justify-between h-full shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="font-bold text-zinc-800 dark:text-white mb-1">Kelola Kursus</div>
                <div className="text-sm text-zinc-500 dark:text-slate-400">Tambah & edit materi</div>
              </div>
            </Card>
          </Link>

          <Link href="/dosen/evaluations">
            <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col justify-between h-full shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="font-bold text-zinc-800 dark:text-white mb-1">Buat Evaluasi</div>
                <div className="text-sm text-zinc-500 dark:text-slate-400">Quiz & assessment</div>
              </div>
            </Card>
          </Link>

          <Link href="/dosen/leaderboard">
            <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col justify-between h-full shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-slate-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="font-bold text-zinc-800 dark:text-white mb-1">Leaderboard</div>
                <div className="text-sm text-zinc-500 dark:text-slate-400">Peringkat mahasiswa</div>
              </div>
            </Card>
          </Link>

          <Link href="/dosen/duel-questions">
            <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col justify-between h-full shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <Swords className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="font-bold text-zinc-800 dark:text-white mb-1">Soal Duel</div>
                <div className="text-sm text-zinc-500 dark:text-slate-400">Soal & jawaban duel</div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Aktivitas Terbaru
                </h3>
                <Link href="/dosen/students">
                  <Button variant="outline" size="sm" className="font-bold border-zinc-200 dark:border-slate-700 hover:bg-zinc-50 dark:hover:bg-slate-800 text-zinc-700 dark:text-slate-300">
                    Lihat Semua
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const getIcon = () => {
                    if (activity.action === 'completed_evaluation') return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
                    if (activity.action === 'started_course') return <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
                    if (activity.action === 'level_up') return <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
                    return <Clock className="w-5 h-5 text-zinc-400 dark:text-slate-500" />;
                  };

                  const timeAgo = new Date(activity.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50/50 dark:bg-slate-900/50 hover:bg-zinc-100/80 dark:hover:bg-slate-800/80 transition-all duration-300 border border-zinc-100 dark:border-slate-800/50"
                    >
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xs">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-zinc-800 dark:text-white">
                          {activity.studentName}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-slate-400 truncate">
                          {activity.details}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-slate-500 whitespace-nowrap">
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
            <Card className="p-6 rounded-xl border border-zinc-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/50 backdrop-blur-md mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                  Evaluasi Aktif
                </h3>
              </div>

              <div className="space-y-3">
                {activeEvaluations.map((evaluation) => (
                  <Link
                    key={evaluation.id}
                    href={`/evaluation/${evaluation.id}`}
                    className="block p-4 rounded-xl border border-zinc-200 dark:border-slate-800 hover:border-zinc-300 dark:hover:border-slate-700 transition-all duration-300 bg-zinc-50/50 dark:bg-slate-900/50 hover:bg-zinc-100/80 dark:hover:bg-slate-800/80 group shadow-xs"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-sm text-zinc-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {evaluation.title}
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                        AKTIF
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-slate-400 mb-3">
                      {evaluation.questions.length} soal • {evaluation.duration} menit
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-slate-500 font-medium">
                        <Users className="w-3 h-3" />
                        <span>12 submission</span>
                      </div>
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Buka Ruang <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                ))}

                <Link href="/dosen/evaluations">
                  <Button className="w-full bg-zinc-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-slate-200 font-bold shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Evaluasi Baru
                  </Button>
                </Link>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
