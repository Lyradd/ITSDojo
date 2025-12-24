"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { MOCK_STUDENTS, Student } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Search, 
  TrendingUp, 
  Zap,
  Target,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'xp' | 'accuracy' | 'name'>('xp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  // Filter students
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'xp') comparison = a.xp - b.xp;
    else if (sortBy === 'accuracy') comparison = a.accuracy - b.accuracy;
    else comparison = a.name.localeCompare(b.name);
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'xp' | 'accuracy' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Monitoring Mahasiswa
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Pantau progress dan performa semua mahasiswa
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm text-blue-100 mb-1">Total Mahasiswa</div>
          <div className="text-3xl font-bold">{students.length}</div>
        </Card>
        <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <div className="text-sm text-purple-100 mb-1">Rata-rata XP</div>
          <div className="text-3xl font-bold">
            {Math.round(students.reduce((acc, s) => acc + s.xp, 0) / students.length)}
          </div>
        </Card>
        <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="text-sm text-green-100 mb-1">Rata-rata Akurasi</div>
          <div className="text-3xl font-bold">
            {Math.round(students.reduce((acc, s) => acc + s.accuracy, 0) / students.length)}%
          </div>
        </Card>
        <Card className="p-4 rounded-xl border-2 bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <div className="text-sm text-orange-100 mb-1">Aktif Hari Ini</div>
          <div className="text-3xl font-bold">
            {students.filter(s => s.lastActive.includes('hour') || s.lastActive.includes('minute')).length}
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-6 rounded-2xl border-2 mb-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              placeholder="Cari nama atau email mahasiswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'xp' ? 'default' : 'outline'}
              onClick={() => handleSort('xp')}
              className="font-bold"
            >
              <Zap className="w-4 h-4 mr-2" />
              XP
              {sortBy === 'xp' && (
                <ArrowUpDown className="w-3 h-3 ml-1" />
              )}
            </Button>
            <Button
              variant={sortBy === 'accuracy' ? 'default' : 'outline'}
              onClick={() => handleSort('accuracy')}
              className="font-bold"
            >
              <Target className="w-4 h-4 mr-2" />
              Akurasi
              {sortBy === 'accuracy' && (
                <ArrowUpDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Student Table */}
      <Card className="rounded-2xl border-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b-2">
              <tr>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Rank
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Mahasiswa
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Level
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  XP
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Akurasi
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Streak
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Evaluasi
                </th>
                <th className="text-left p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">
                  Terakhir Aktif
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr 
                  key={student.id}
                  className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-zinc-800 dark:text-zinc-100">
                      #{index + 1}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        student.avatar
                      )}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
                          {student.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold">
                        Lv {student.level}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-bold text-sm text-zinc-800 dark:text-zinc-100">
                      <Zap className="w-4 h-4 text-yellow-600" fill="currentColor" />
                      {student.xp}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            student.accuracy >= 90 ? "bg-green-500" :
                            student.accuracy >= 75 ? "bg-blue-500" :
                            student.accuracy >= 60 ? "bg-yellow-500" :
                            "bg-red-500"
                          )}
                          style={{ width: `${student.accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 w-12">
                        {student.accuracy}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm font-bold text-orange-600">
                      <Flame className="w-4 h-4" fill="currentColor" />
                      {student.streak}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {student.evaluationsCompleted} selesai
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {student.lastActive}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* No Results */}
      {sortedStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500 dark:text-zinc-400">
            Tidak ada mahasiswa yang ditemukan
          </p>
        </div>
      )}
    </div>
  </div>
);
}
