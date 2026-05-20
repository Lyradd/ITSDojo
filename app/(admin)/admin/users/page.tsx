"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, UserCog, ShieldAlert, Trash2, Edit3, Shield,
  CheckCircle2, UserPlus, X, BookOpen, Link2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { ConfirmModal } from '@/components/shared/confirm-modal';

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'assignments'>('users');

  // Database States
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<{ instructors: any[]; assistants: any[]; students: any[] }>({
    instructors: [],
    assistants: [],
    students: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Add User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('mahasiswa');
  const [newSemester, setNewSemester] = useState(1);

  // Assignment Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignType, setAssignType] = useState<'instructor' | 'assistant' | 'student'>('student');

  // Confirm modal state
  const [unassignTarget, setUnassignTarget] = useState<{ type: string; id: number; name?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Fetch all initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, coursesRes, assignRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/courses'),
        fetch('/api/admin/assignments')
      ]);

      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();
      const assignData = await assignRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      if (assignData && !assignData.error) {
        setAssignments(assignData);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (isMounted) {
      if (role !== 'admin') {
        if (role === 'dosen') router.push('/dosen');
        else if (role === 'asdos') router.push('/asdos');
        else router.push('/learn');
      } else {
        loadData();
      }
    }
  }, [isMounted, role, router, loadData]);

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          semester: newSemester
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat user");

      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('mahasiswa');
      setNewSemester(1);
      loadData();
      toast.success(`Pengguna "${newName}" berhasil ditambahkan!`);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupdate user");

      setIsEditModalOpen(false);
      setEditingUser(null);
      loadData();
      toast.success(`Data pengguna "${editingUser.name}" berhasil diperbarui!`);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Gagal menghapus user");
      loadData();
      toast.success('Pengguna berhasil dihapus.');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Handle Class Assignment (Pre-Assign)
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedCourseId) {
      toast.error('Harap pilih User dan Kelas terlebih dahulu.');
      return;
    }
    setSaving(true);
    const userName = users.find(u => u.id === selectedUserId)?.name || 'Pengguna';
    const courseName = courses.find(c => c.id === selectedCourseId)?.title || 'Kelas';
    const typeLabel = assignType === 'instructor' ? 'Dosen Pengampu' : assignType === 'assistant' ? 'Asisten Dosen' : 'Mahasiswa';
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          courseId: selectedCourseId,
          type: assignType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menugaskan ke kelas');

      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={`${
            t.visible ? 'opacity-100' : 'opacity-0'
          } max-w-sm w-full bg-white dark:bg-zinc-900 border-2 border-green-200 dark:border-green-800 shadow-2xl shadow-green-500/10 rounded-2xl pointer-events-auto flex gap-4 p-4`}
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-zinc-900 dark:text-white">Penugasan Berhasil! 🎉</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{userName}</span> telah ditugaskan sebagai{' '}
              <span className="font-semibold text-purple-600 dark:text-purple-400">{typeLabel}</span> di kelas{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{courseName}</span>.
            </p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ), { duration: 5000 });

      setSelectedUserId('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menugaskan.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Unassign Class
  const handleUnassign = (type: string, id: number) => {
    setUnassignTarget({ type, id });
  };

  const confirmUnassign = async () => {
    if (!unassignTarget) return;
    try {
      const res = await fetch(`/api/admin/assignments?type=${unassignTarget.type}&id=${unassignTarget.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal membatalkan penugasan');
      loadData();
      toast.success('Penugasan berhasil dibatalkan.');
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setUnassignTarget(null);
    }
  };

  if (!isMounted || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-bold mb-4">
              <Shield className="w-4 h-4" />
              Super Admin Area
            </div>
            <h1 className="text-4xl font-bold text-blue-700 dark:text-white mb-2">
              Manajemen Sistem Kelas
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Kelola role pengguna dan lakukan pre-assignment mahasiswa serta dosen ke mata kuliah.
            </p>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-500/25 shrink-0"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Tambah User Baru
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900/50 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500">Mahasiswa</div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                  {users.filter(u => u.role === 'mahasiswa').length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900/50 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500">Dosen</div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                  {users.filter(u => u.role === 'dosen').length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900/50 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500">Asisten Dosen</div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                  {users.filter(u => u.role === 'asdos').length}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900/50 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-500">Aktif Penugasan</div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                  {assignments.instructors.length + assignments.assistants.length + assignments.students.length}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b pb-1 border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[3px] flex items-center gap-2",
              activeTab === 'users'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Users className="w-4 h-4" />
            Kelola Pengguna
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={cn(
              "px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[3px] flex items-center gap-2",
              activeTab === 'assignments'
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            <Link2 className="w-4 h-4" />
            Penugasan Kelas (Pre-Assign)
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm text-zinc-500 mt-2">Mengambil data dari database...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'users' ? (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Users Table */}
                <Card className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-100 dark:bg-zinc-900/80 border-b">
                          <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Nama Lengkap</th>
                          <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Email</th>
                          <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Role</th>
                          <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Semester</th>
                          <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-zinc-900 dark:text-white">{user.name}</div>
                              <span className="text-xs text-zinc-400 font-mono">{user.id}</span>
                            </td>
                            <td className="p-4 text-zinc-600 dark:text-zinc-300 text-sm">
                              {user.email}
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-full uppercase",
                                user.role === 'admin' && "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                                user.role === 'dosen' && "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
                                user.role === 'asdos' && "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
                                user.role === 'mahasiswa' && "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              )}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-600 dark:text-zinc-300 text-sm font-semibold">
                              {user.role === 'mahasiswa' || user.role === 'asdos' ? `Semester ${user.semester}` : '-'}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingUser({ ...user });
                                    setIsEditModalOpen(true);
                                  }}
                                  className="h-8 w-8 text-zinc-500 hover:text-blue-600"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="assign-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form Assignment */}
                <Card className="p-6 rounded-2xl border bg-white dark:bg-zinc-900/50 h-fit">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    Penugasan Baru
                  </h3>

                  <form onSubmit={handleAssign} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500">Tipe Penugasan</label>
                      <select
                        value={assignType}
                        onChange={(e) => {
                          setAssignType(e.target.value as any);
                          setSelectedUserId('');
                        }}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="student">Mahasiswa → Kelas</option>
                        <option value="instructor">Dosen Pengampu → Kelas</option>
                        <option value="assistant">Asisten Dosen → Kelas</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500">Pilih Kelas</label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        required
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500">Pilih User</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="">-- Pilih User --</option>
                        {users
                          .filter(u => {
                            if (assignType === 'student') return u.role === 'mahasiswa';
                            if (assignType === 'instructor') return u.role === 'dosen';
                            if (assignType === 'assistant') return u.role === 'asdos';
                            return false;
                          })
                          .map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.role === 'mahasiswa' ? `(Smtr ${u.semester})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                      Tugaskan Kelas
                    </Button>
                  </form>
                </Card>

                {/* List Assignments — Grouped by Person */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Dosen Assignments */}
                  <Card className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900/50">
                    <div className="p-4 border-b font-bold text-sm bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-purple-600" />
                        Dosen Pengampu Kelas
                      </div>
                      {assignments.instructors.length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">
                          {(() => {
                            const grouped = assignments.instructors.reduce((acc: Record<string, any[]>, item) => {
                              const key = item.userId || item.userName;
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(item);
                              return acc;
                            }, {});
                            return `${Object.keys(grouped).length} Dosen · ${assignments.instructors.length} Kelas`;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                      {assignments.instructors.length === 0 ? (
                        <div className="p-6 text-xs text-zinc-500 text-center">Belum ada dosen yang ditugaskan ke kelas manapun.</div>
                      ) : (
                        (() => {
                          const grouped = assignments.instructors.reduce((acc: Record<string, any[]>, item) => {
                            const key = item.userId || item.userName;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(item);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([key, items]) => (
                            <div key={key} className="p-4 border-b last:border-b-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold shrink-0">
                                      {items[0].userName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">{items[0].userName}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 ml-10">
                                    {items.map(item => (
                                      <span key={item.id} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-800/30 group">
                                        <BookOpen className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-[160px]">{item.courseTitle}</span>
                                        <button
                                          onClick={() => handleUnassign('instructor', item.id)}
                                          className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                          title="Hapus penugasan"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </Card>

                  {/* Asdos Assignments */}
                  <Card className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900/50">
                    <div className="p-4 border-b font-bold text-sm bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-orange-600" />
                        Asisten Dosen Pendamping
                      </div>
                      {assignments.assistants.length > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold">
                          {(() => {
                            const grouped = assignments.assistants.reduce((acc: Record<string, any[]>, item) => {
                              const key = item.userId || item.userName;
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(item);
                              return acc;
                            }, {});
                            return `${Object.keys(grouped).length} Asdos · ${assignments.assistants.length} Kelas`;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                      {assignments.assistants.length === 0 ? (
                        <div className="p-6 text-xs text-zinc-500 text-center">Belum ada asdos yang ditugaskan ke kelas manapun.</div>
                      ) : (
                        (() => {
                          const grouped = assignments.assistants.reduce((acc: Record<string, any[]>, item) => {
                            const key = item.userId || item.userName;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(item);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([key, items]) => (
                            <div key={key} className="p-4 border-b last:border-b-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold shrink-0">
                                      {items[0].userName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">{items[0].userName}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 ml-10">
                                    {items.map(item => (
                                      <span key={item.id} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 px-2.5 py-1 rounded-lg border border-orange-200/50 dark:border-orange-800/30 group">
                                        <BookOpen className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-[160px]">{item.courseTitle}</span>
                                        <button
                                          onClick={() => handleUnassign('assistant', item.id)}
                                          className="ml-0.5 text-orange-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                          title="Hapus penugasan"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </Card>

                  {/* Student Enrollments */}
                  <Card className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900/50">
                    <div className="p-4 border-b font-bold text-sm bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Pendaftaran Kelas Mahasiswa
                      </div>
                      {assignments.students.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                          {(() => {
                            const grouped = assignments.students.reduce((acc: Record<string, any[]>, item) => {
                              const key = item.userId || item.userName;
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(item);
                              return acc;
                            }, {});
                            return `${Object.keys(grouped).length} Mahasiswa · ${assignments.students.length} Kelas`;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                      {assignments.students.length === 0 ? (
                        <div className="p-6 text-xs text-zinc-500 text-center">Belum ada mahasiswa yang didaftarkan ke kelas manapun.</div>
                      ) : (
                        (() => {
                          const grouped = assignments.students.reduce((acc: Record<string, any[]>, item) => {
                            const key = item.userId || item.userName;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(item);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([key, items]) => (
                            <div key={key} className="p-4 border-b last:border-b-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold shrink-0">
                                      {items[0].userName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">{items[0].userName}</span>
                                    {items[0].userSemester && (
                                      <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Smtr {items[0].userSemester}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 ml-10">
                                    {items.map(item => (
                                      <span key={item.id} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2.5 py-1 rounded-lg border border-green-200/50 dark:border-green-800/30 group">
                                        <BookOpen className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-[160px]">{item.courseTitle}</span>
                                        <button
                                          onClick={() => handleUnassign('student', item.id)}
                                          className="ml-0.5 text-green-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                          title="Hapus penugasan"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Modal Tambah User */}
        <AnimatePresence>
          {isAddModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100]"
                onClick={() => setIsAddModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border shadow-2xl z-[101] overflow-hidden"
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Tambah Pengguna</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddModalOpen(false)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
                    <input
                      required
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: Dr. Budi Santoso"
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email ITS</label>
                    <input
                      required
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="budi@itsdojo.id"
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="mahasiswa">Mahasiswa</option>
                        <option value="asdos">Asisten Dosen</option>
                        <option value="dosen">Dosen</option>
                        <option value="admin">Super Admin</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Semester</label>
                      <input
                        type="number"
                        min="1" max="14"
                        value={newSemester}
                        disabled={newRole === 'dosen' || newRole === 'admin'}
                        onChange={(e) => setNewSemester(Number(e.target.value))}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1 rounded-xl">
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                      {saving ? "Menyimpan..." : "Simpan User"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </>
          )}

          {/* Modal Edit User */}
          {isEditModalOpen && editingUser && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100]"
                onClick={() => setIsEditModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border shadow-2xl z-[101] overflow-hidden"
              >
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Pengguna</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
                    <input
                      required
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email ITS</label>
                    <input
                      required
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Role</label>
                      <select
                        value={editingUser.role || 'mahasiswa'}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="mahasiswa">Mahasiswa</option>
                        <option value="asdos">Asisten Dosen</option>
                        <option value="dosen">Dosen</option>
                        <option value="admin">Super Admin</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Semester</label>
                      <input
                        type="number"
                        min="1" max="14"
                        value={editingUser.semester || 1}
                        disabled={editingUser.role === 'dosen' || editingUser.role === 'admin'}
                        onChange={(e) => setEditingUser({ ...editingUser, semester: Number(e.target.value) })}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1 rounded-xl">
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
