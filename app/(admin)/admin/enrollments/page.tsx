"use client";

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { MOCK_ENROLLMENT_REQUESTS, EnrollmentRequest } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Filter,
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
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [requests, setRequests] = useState<EnrollmentRequest[]>(MOCK_ENROLLMENT_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  const isDosen = role === 'dosen';

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const uniqueCourses = Array.from(new Set(requests.map(r => r.courseId))).map(id => ({
    id,
    title: requests.find(r => r.courseId === id)?.courseTitle || id,
  }));

  const filtered = requests.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchCourse = courseFilter === 'all' || r.courseId === courseFilter;
    return matchStatus && matchCourse;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r));
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Permintaan Kelas
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              {isDosen
                ? 'Kelola permintaan masuk kelas dari mahasiswa'
                : 'Lihat status permintaan pendaftaran mahasiswa (hanya dosen yang dapat menyetujui)'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 opacity-80" />
              <div>
                <div className="text-xs text-yellow-100">Menunggu</div>
                <div className="text-3xl font-bold">{requests.filter(r => r.status === 'pending').length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 opacity-80" />
              <div>
                <div className="text-xs text-green-100">Diterima</div>
                <div className="text-3xl font-bold">{requests.filter(r => r.status === 'accepted').length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 opacity-80" />
              <div>
                <div className="text-xs text-red-100">Ditolak</div>
                <div className="text-3xl font-bold">{requests.filter(r => r.status === 'rejected').length}</div>
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
        <Card className="p-4 rounded-2xl border-2 mb-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'accepted', 'rejected'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                  className={cn('font-bold text-xs', statusFilter === s && 'bg-blue-600 hover:bg-blue-700')}
                >
                  {s === 'all' ? 'Semua' : STATUS_LABELS[s].label}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            <div className="ml-auto">
              <select
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-500 transition-colors"
                value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
              >
                <option value="all">Semua Kursus</option>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0", req.studentAvatar)}>
                      {req.studentName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-100">{req.studentName}</div>
                      <div className="text-xs text-zinc-500">{req.studentEmail}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          Semester {req.studentSemester}
                        </span>
                        {req.studentSemester < req.courseRequiredSemester && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                            ⚠️ Semester belum nyampe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="flex items-center gap-2 sm:w-56">
                    <BookOpen className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{req.courseTitle}</div>
                      <div className="text-[10px] text-zinc-500">Min. Semester {req.courseRequiredSemester}</div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-zinc-400 sm:w-24 shrink-0">
                    {formatRelativeTime(req.requestedAt)}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold", STATUS_LABELS[req.status].color)}>
                      {STATUS_LABELS[req.status].label}
                    </span>
                    {isDosen && req.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(req.id)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 text-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Terima
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(req.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold h-8 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Tolak
                        </Button>
                      </>
                    )}
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
