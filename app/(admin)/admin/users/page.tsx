"use client";

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store';
import { MOCK_STUDENTS } from '@/lib/admin-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCog, ShieldAlert, Trash2, Edit3, Shield, CheckCircle2, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuperAdminUsersPage() {
  const { role } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState(MOCK_STUDENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('mahasiswa');
  const [newSemester, setNewSemester] = useState(1);
  
  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: `student-new-${Date.now()}`,
      name: newName,
      email: newEmail,
      xp: 0,
      level: 1,
      accuracy: 0,
      coursesEnrolled: 0,
      evaluationsCompleted: 0,
      lastActive: 'Baru saja',
      avatar: 'bg-emerald-200 text-emerald-700',
      streak: 0,
      semester: newSemester,
      role: newRole,
    };
    
    // @ts-ignore - mengabaikan typescript sementara untuk role di mock data
    setUsers([newUser, ...users]);
    setIsAddModalOpen(false);
    
    // Reset form
    setNewName('');
    setNewEmail('');
    setNewRole('mahasiswa');
    setNewSemester(1);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Apakah kamu yakin ingin menghapus user ini?")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleRoleChange = (id: string, newRole: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const openEditModal = (user: any) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  // Cuma role admin yang boleh lihat ini
  if (role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Akses Ditolak</h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md">
          Halaman ini khusus untuk Super Admin. Dosen dan Asdos tidak memiliki akses ke manajemen pengguna tingkat lanjut.
        </p>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
              Manajemen Pengguna
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Atur role, akses, dan kelola semua akun di dalam ekosistem ITSDojo.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Mahasiswa</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{users.length}</div>
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Dosen</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">5</div>
              </div>
            </div>
          </Card>
          <Card className="p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Asisten Dosen</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">12</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabel Users */}
        <Card className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900/80 border-b-2 border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Nama Lengkap</th>
                  <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Role</th>
                  <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400">Akses</th>
                  <th className="p-4 font-bold text-sm text-zinc-600 dark:text-zinc-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 15).map((user, i) => (
                  <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0", user.avatar)}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select 
                        className="bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-medium rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                        value={(user as any).role || 'mahasiswa'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="mahasiswa">Mahasiswa</option>
                        <option value="asdos">Asdos</option>
                        <option value="dosen">Dosen</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditModal(user)}
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

        {/* Modal Tambah User */}
        <AnimatePresence>
          {isAddModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={() => setIsAddModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-[101] overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
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
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email ITS</label>
                    <input 
                      required
                      type="email" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="budi@student.its.ac.id"
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Role</label>
                      <select 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                        onChange={(e) => setNewSemester(Number(e.target.value))}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1 rounded-xl">
                      Batal
                    </Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                      Simpan User
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={() => setIsEditModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-[101] overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
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
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email ITS</label>
                    <input 
                      required
                      type="email" 
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Role</label>
                      <select 
                        value={editingUser.role || 'mahasiswa'}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                        onChange={(e) => setEditingUser({ ...editingUser, semester: Number(e.target.value) })}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1 rounded-xl">
                      Batal
                    </Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                      Simpan Perubahan
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
