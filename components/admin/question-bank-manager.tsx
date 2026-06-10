"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Database, Plus, Search, BookOpen, Swords, ClipboardCheck, ArrowRight, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getQuestionPackagesWithCount, createQuestionPackage, deleteQuestionPackage } from "@/actions/question-bank";
import { getAllCourses } from "@/actions/courses";
import Link from "next/link";
import toast from "react-hot-toast";

type UsageType = "lesson" | "evaluation" | "duel";

export function QuestionBankManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [activeTab, setActiveTab] = useState<UsageType>("evaluation");
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { name } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchInitData = async () => {
      const coursesData = await getAllCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
      }
      setLoading(false);
    };
    fetchInitData();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    
    const fetchPackages = async () => {
      setLoadingPackages(true);
      const res = await getQuestionPackagesWithCount(selectedCourse, activeTab);
      if (res.success) {
        setPackages(res.data || []);
      } else {
        setPackages([]);
      }
      setLoadingPackages(false);
    };
    
    fetchPackages();
  }, [selectedCourse, activeTab]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !formData.name) return;
    
    setSaving(true);
    const res = await createQuestionPackage({
      courseId: selectedCourse,
      usageType: activeTab,
      name: formData.name,
      description: formData.description,
      createdBy: name,
    });
    
    if (res.success && res.data) {
      setPackages([res.data, ...packages]);
      setShowCreateForm(false);
      setFormData({ name: "", description: "" });
    }
    setSaving(false);
  };

  const handleDeletePackage = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus paket soal ini? Semua soal di dalamnya akan terhapus secara permanen.")) return;

    const res = await deleteQuestionPackage(id);
    if (res.success) {
      setPackages(packages.filter(p => p.id !== id));
      toast.success("Paket berhasil dihapus");
    } else {
      toast.error("Gagal menghapus paket");
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10 blur-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-blue-700 dark:text-white">
                  Bank Soal Terpusat
                </h1>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                Kelola paket-paket soal untuk Evaluasi, Lesson, dan Brain Duel
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg"
            >
              {showCreateForm ? (
                <><X className="w-4 h-4 mr-2" /> Batal</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Buat Paket Baru</>
              )}
            </Button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6 rounded-2xl border-2 mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">
              Buat Paket {activeTab === "evaluation" ? "Evaluasi" : activeTab === "lesson" ? "Latihan" : "Duel"} Baru
            </h3>
            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Mata Kuliah *</Label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 dark:text-white">
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Paket *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Kuis Tengah Semester Pemrograman Web"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi singkat mengenai isi paket soal ini..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="bg-linear-to-r from-blue-600 to-blue-700 font-bold">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Simpan Paket
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Course Selector */}
          <Card className="p-2 rounded-xl flex-1 max-w-sm border-2 bg-white/50 dark:bg-zinc-900/50">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full h-10 px-3 bg-transparent border-none focus:ring-0 font-semibold"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 dark:text-white">
                  {c.title}
                </option>
              ))}
            </select>
          </Card>

          {/* Type Tabs */}
          <Card className="p-1 rounded-xl flex gap-1 border-2 bg-white/50 dark:bg-zinc-900/50">
            <Button
              variant={activeTab === 'lesson' ? 'default' : 'ghost'}
              className={cn("rounded-lg flex-1", activeTab === 'lesson' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}
              onClick={() => setActiveTab('lesson')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Lesson
            </Button>
            <Button
              variant={activeTab === 'evaluation' ? 'default' : 'ghost'}
              className={cn("rounded-lg flex-1", activeTab === 'evaluation' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400")}
              onClick={() => setActiveTab('evaluation')}
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Evaluation
            </Button>
            <Button
              variant={activeTab === 'duel' ? 'default' : 'ghost'}
              className={cn("rounded-lg flex-1", activeTab === 'duel' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}
              onClick={() => setActiveTab('duel')}
            >
              <Swords className="w-4 h-4 mr-2" />
              Brain Duel
            </Button>
          </Card>
        </div>

        {/* Packages Grid */}
        {loadingPackages ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed">
            <Database className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Belum ada paket soal</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Pilih "Buat Paket Baru" untuk mulai menambahkan kumpulan soal.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>Buat Paket Baru</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id}
                className="p-6 rounded-2xl border-2 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-zinc-900/80 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    pkg.usageType === 'lesson' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                    pkg.usageType === 'evaluation' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
                    pkg.usageType === 'duel' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                  )}>
                    {pkg.usageType === 'lesson' && <BookOpen className="w-6 h-6" />}
                    {pkg.usageType === 'evaluation' && <ClipboardCheck className="w-6 h-6" />}
                    {pkg.usageType === 'duel' && <Swords className="w-6 h-6" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {pkg.usageType}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Hapus Paket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                  {pkg.name}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 flex-1 line-clamp-2">
                  {pkg.description || "Tidak ada deskripsi."}
                </p>
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3">
                  📝 {pkg._itemCount || 0} soal dalam paket
                </div>
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Oleh: {pkg.createdBy || "Admin"}</span>
                  <Button variant="ghost" className="hover:bg-blue-50 hover:text-blue-600 font-semibold" asChild>
                    <Link href={`question-bank/${pkg.id}`}>
                      Lihat Soal <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
