"use client";

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { EnrollmentRequest } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Filter,
  RefreshCcw,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABELS = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  accepted: { label: 'Diterima', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function formatRelativeTime(ts: number) {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  return `${Math.floor(diffHr / 24)} hari lalu`;
}

export default function EnrollmentsPage() {
  const { role, pendingCourseIds, acceptEnrollment, rejectEnrollment } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [processedRequests, setProcessedRequests] = useState<EnrollmentRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Sync state across tabs from localStorage manually
    await useUserStore.persist.rehydrate();
    // Simulate network delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const isDosen = role === 'dosen';

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const getCourseTitle = (id: string) => {
    const map: Record<string, string> = {
      'dasar-pemrograman': 'Dasar Pemrograman',
      'pemrograman-web': 'Pemrograman Web',
      'sistem-basis-data': 'Sistem Basis Data',
      'sistem-digital': 'Sistem Digital',
      'sistem-operasi': 'Sistem Operasi',
      'struktur-data': 'Struktur Data',
    };
    return map[id] || id;
  };

  const getCourseSem = (id: string) => {
    const map: Record<string, number> = {
      'dasar-pemrograman': 1, 'pemrograman-web': 1, 'sistem-digital': 2,
      'sistem-basis-data': 3, 'sistem-operasi': 3, 'struktur-data': 3,
    };
    return map[id] || 1;
  };

  const dynamicRequests: EnrollmentRequest[] = pendingCourseIds.map(courseId => ({
    id: `dynamic-${courseId}`,
    studentId: 'mahasiswa-1',
    studentName: 'Mahasiswa Teladan (Demo)',
    studentEmail: 'siswa@itsdojo.id',
    studentAvatar: 'bg-blue-100 text-blue-700',
    studentSemester: 3,
    courseId: courseId,
    courseTitle: getCourseTitle(courseId),
    courseRequiredSemester: getCourseSem(courseId),
    requestedAt: Date.now() - 60000,
    status: 'pending',
  }));

  const allRequests = [...dynamicRequests, ...processedRequests];

  const uniqueCourses = Array.from(new Set(allRequests.map(r => r.courseId))).map(id => ({
    id,
    title: allRequests.find(r => r.courseId === id)?.courseTitle || id,
  }));

  const filtered = allRequests.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchCourse = courseFilter === 'all' || r.courseId === courseFilter;
    return matchStatus && matchCourse;
  });

  const pendingCount = allRequests.filter(r => r.status === 'pending').length;

  const handleAccept = (id: string) => {
    if (id.startsWith('dynamic-')) {
      const req = dynamicRequests.find(r => r.id === id);
      if (req) {
        setProcessedRequests(prev => [{ ...req, status: 'accepted' }, ...prev]);
      }
      acceptEnrollment(id.replace('dynamic-', ''));
    }
  };

  const handleReject = (id: string) => {
    if (id.startsWith('dynamic-')) {
      const req = dynamicRequests.find(r => r.id === id);
      if (req) {
        setProcessedRequests(prev => [{ ...req, status: 'rejected' }, ...prev]);
      }
      rejectEnrollment(id.replace('dynamic-', ''));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-blue-600" />
                  <h1 className="text-4xl font-bold text-blue-700 dark:text-white">
                    Permintaan Kelas
                  </h1>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm self-start sm:self-auto"
              >
                <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                <span className="hidden sm:inline">{isRefreshing ? "Menyinkronkan..." : "Refresh Data"}</span>
                <span className="sm:hidden">{isRefreshing ? "..." : "Refresh"}</span>
              </Button>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              {isDosen
                ? 'Kelola permintaan masuk kelas dari mahasiswa'
                : 'Lihat status permintaan pendaftaran mahasiswa (hanya dosen yang dapat menyetujui)'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 opacity-80" />
              <div>
                <div className="text-xs text-yellow-100">Menunggu</div>
                <div className="text-3xl font-bold">{allRequests.filter(r => r.status === 'pending').length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 opacity-80" />
              <div>
                <div className="text-xs text-green-100">Diterima</div>
                <div className="text-3xl font-bold">{allRequests.filter(r => r.status === 'accepted').length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 opacity-80" />
              <div>
                <div className="text-xs text-red-100">Ditolak</div>
                <div className="text-3xl font-bold">{allRequests.filter(r => r.status === 'rejected').length}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Asdos notice */}
        {!isDosen && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 font-medium">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Kamu login sebagai <b>Asisten Dosen</b>. Hanya Dosen yang dapat menyetujui atau menolak permintaan ini.</span>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 rounded-2xl border-2 mb-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Filter className="w-4 h-4 text-zinc-500 shrink-0 mr-1" />
              {(['all', 'pending', 'accepted', 'rejected'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                  className={cn('font-bold text-xs shrink-0', statusFilter === s && 'bg-blue-600 hover:bg-blue-700')}
                >
                  {s === 'all' ? 'Semua' : STATUS_LABELS[s].label}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className={cn(
                      "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors",
                      statusFilter === 'pending' 
                        ? "bg-white/30 text-white" 
                        : "bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-zinc-300"
                    )}>
                      {pendingCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <div className="w-full lg:w-64 shrink-0">
              <select
                className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-500 transition-colors"
                value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
              >
                <option value="all">Semua Kelas</option>
                {uniqueCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Requests List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500 dark:text-zinc-400">Tidak ada permintaan yang ditemukan</p>
            </div>
          ) : (
            filtered.map(req => (
              <Card
                key={req.id}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm",
                  req.status === 'pending' && "border-yellow-200 dark:border-yellow-800/50",
                  req.status === 'accepted' && "border-green-200 dark:border-green-800/50",
                  req.status === 'rejected' && "border-red-200 dark:border-red-800/50 opacity-60",
                )}
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left Section: Student and Course Info */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0", req.studentAvatar)}>
                        {req.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-800 dark:text-zinc-100 truncate">{req.studentName}</div>
                        <div className="text-xs text-zinc-500 truncate">{req.studentEmail}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Semester {req.studentSemester}
                          </span>
                          {req.studentSemester < req.courseRequiredSemester && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                              ⚠️ Semester belum nyampe
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 md:bg-transparent md:dark:bg-transparent md:p-0 md:border-0 md:w-56 shrink-0">
                      <BookOpen className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate">{req.courseTitle}</div>
                        <div className="text-[10px] text-zinc-500">Min. Semester {req.courseRequiredSemester}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Time, Status, and Action Buttons */}
                  <div className="flex flex-row flex-wrap items-center justify-between xl:justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 xl:pt-0 xl:border-t-0">
                    {/* Time */}
                    <div className="text-xs text-zinc-400 whitespace-nowrap">
                      {formatRelativeTime(req.requestedAt)}
                    </div>

                    {/* Status and Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap", STATUS_LABELS[req.status].color)}>
                        {STATUS_LABELS[req.status].label}
                      </span>
                      {isDosen && req.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(req.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 text-xs shrink-0"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Terima
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(req.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold h-8 text-xs shrink-0"
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
