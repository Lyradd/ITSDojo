"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { COURSES } from "@/lib/dummydata";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Zap,
  Trophy,
  BookOpen,
  Medal,
  Calendar,
  Settings,
  Share2,
  User,
  Users,
  CheckCircle2,
  Lock,
  Moon,
  Sunrise,
  ShieldCheck,
  Bug,
  X,
  Edit3,
  Check,
  Camera
} from "lucide-react";
import { toast } from "react-hot-toast";
import { StatWidget } from "@/components/shared/stat-widget";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { getAchievementsData } from "@/lib/profile-data";

export default function ProfilePage() {
  const {
    name, xp, streak, completedLessonIds = [], unlockedAchievements = [],
    nocturnalCount = 0, earlyBirdCount = 0, longestStreak = 0, mostXpInDay = 0, totalPerfectLessons = 0,
    activeCourseId, bio, avatarUrl, updateProfile, league, top3Finishes,
    createdAt
  } = useUserStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempBio, setTempBio] = useState(bio);

  const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Spooky",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow"
  ];

  const handleSaveProfile = () => {
    updateProfile({ name: tempName, bio: tempBio });
    setIsEditing(false);
    toast.success("Profil berhasil diperbarui!");
  };

  const handleShare = async () => {
    const shareData = {
      title: 'ITSDojo Profile',
      text: `Cek profil belajar saya di ITSDojo! Saya sudah mencapai level ${Math.floor(xp / 100) + 1} dengan ${streak} hari streak!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link profil disalin ke clipboard!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Modal UX Handlers ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsAvatarModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- MOCK DATA (Data Dummy untuk Profil) ---
  const username = name.toLowerCase().replace(/\s/g, "");
  const joinDate = createdAt 
    ? new Date(createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : 'Baru Bergabung';

  // Data Pencapaian (Achievements)
  const achievements = getAchievementsData({
    streak,
    xp,
    completedLessonIds,
    nocturnalCount,
    earlyBirdCount,
    unlockedAchievements
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* === KOLOM KIRI: INFO UTAMA === */}
        <div className="flex flex-col gap-8">

          {/* 1. Header Profil */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b">
            {/* Avatar Besar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-blue-600 border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center text-5xl font-bold text-white shadow-xl overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform text-blue-500"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              {isEditing ? (
                <div className="space-y-3 max-w-sm">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-2 border-blue-500 rounded-xl px-4 py-2 font-bold text-xl outline-none"
                    placeholder="Nama Anda"
                  />
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none resize-none"
                    placeholder="Tulis bio singkat..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
                      <Check className="w-4 h-4" /> Simpan
                    </Button>
                    <Button onClick={() => { setIsEditing(false); setTempName(name); setTempBio(bio); }} size="sm" variant="ghost" className="rounded-xl">
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white">{name}</h1>
                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-400 font-medium">@{username}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">"{bio}"</p>
                </>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-zinc-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Bergabung {joinDate}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 120 Mengikuti
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 85 Pengikut
                </div>
              </div>
            </div>

            {/* Tombol Aksi (Edit/Share) */}
            <div className="flex gap-2">
              <Button onClick={handleShare} variant="outline" size="icon" className="rounded-xl border-2 hover:bg-zinc-100 hover:border-zinc-300">
                <Share2 className="w-5 h-5 text-zinc-400" />
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="icon" className="rounded-xl border-2 hover:bg-zinc-100 hover:border-zinc-300">
                  <Settings className="w-5 h-5 text-zinc-400" />
                </Button>
              </Link>
            </div>
          </div>

          {/* 2. Statistik */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-zinc-700 dark:text-zinc-200">Statistik</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatWidget icon={Flame} value={streak} label="Current Streak" color="text-orange-500" />
              <StatWidget icon={Zap} value={xp.toLocaleString('id-ID')} label="Total XP" color="text-blue-500" />
              <StatWidget icon={Medal} value={league} label="League" color="text-yellow-500" />
              <StatWidget icon={Trophy} value={top3Finishes} label="Top 3 Finishes" color="text-purple-500" />
            </div>
          </div>

          {/* 3. Jejak Aktivitas (Heatmap) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">Aktivitas Belajar</h2>
              <span className="text-xs font-bold text-zinc-500">105 hari terakhir</span>
            </div>
            <Card className="p-6 pt-10 border-2 overflow-x-auto">
              <ActivityHeatmap />
            </Card>
          </div>

          {/* 4. Pencapaian (Achievements) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">Pencapaian</h2>
              <Button onClick={() => setIsModalOpen(true)} variant="ghost" className="text-blue-500 font-bold uppercase text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20">Lihat Semua</Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {achievements.slice(0, 4).map((ach) => (
                <div key={ach.id} className={`flex items-start gap-4 p-4 border-2 rounded-2xl bg-card ${ach.unlocked ? 'border-zinc-200' : 'border-zinc-100 opacity-80'}`}>
                  {/* Icon Badge */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border-b-4 ${ach.unlocked ? ach.color : 'bg-zinc-100 text-zinc-300 border-zinc-200'}`}>
                    {ach.unlocked ? <ach.icon className="w-8 h-8" fill="currentColor" /> : <Lock className="w-8 h-8" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-lg">{ach.title}</h3>
                      <span className="text-xs font-bold text-zinc-400">Level {ach.level}/{ach.maxLevel}</span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-3">{ach.desc}</p>

                    {/* Progress Bar Achievement */}
                    {ach.target && (
                      <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ach.unlocked ? 'bg-yellow-400' : 'bg-zinc-300'}`}
                          style={{ width: `${Math.min((ach.progress / ach.target) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === KOLOM KANAN: SIDEBAR WIDGETS === */}
        <div className="flex flex-col gap-6">

          {/* Kursus Saya */}
          <Card className="p-4 rounded-2xl border-2">
            <h3 className="font-bold text-lg mb-4 text-zinc-700 dark:text-zinc-200">Kursus Saya</h3>
            <div className="space-y-4">
              {COURSES.slice(0, 3).map((course, idx) => (
                <div key={course.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800 ${course.color}`}>
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-sm truncate">{course.title}</h4>
                    <div className="text-xs text-zinc-500 font-bold flex items-center gap-1">
                      <span className={course.id === activeCourseId ? "text-green-500" : "text-zinc-400"}>
                        {course.id === activeCourseId ? "Sedang dipelajari" : "Belum dimulai"}
                      </span>
                    </div>
                  </div>
                  {course.id === activeCourseId && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
              ))}
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="w-full mt-2 text-blue-500 font-bold uppercase text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400">
                Lihat Semua
              </Button>
            </Link>
          </Card>

          {/* Teman (Mock) */}
          <Card className="p-4 rounded-2xl border-2">
            <h3 className="font-bold text-lg mb-4 text-zinc-700 dark:text-zinc-200">Teman Belajar</h3>
            <div className="space-y-4">
              {["Sarah K.", "Budi S.", "Citra A."].map((friend: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border-2 border-zinc-200">
                    {friend.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{friend}</h4>
                    <div className="text-xs text-zinc-400">1.2k XP • Lv. 5</div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold text-blue-500 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-blue-500 font-bold uppercase text-xs hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
              Cari Teman
            </Button>
          </Card>

        </div>
      </div>

      {/* --- ALL ACHIEVEMENTS MODAL --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Trophy Room & Badges
                </h2>
                <p className="text-sm text-zinc-500 mt-1">Koleksi seluruh pencapaian dan lencana rahasia Anda.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">

              {/* --- Personal Records Section --- */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-blue-500" /> Rekor Pribadi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 rounded-xl flex items-center gap-4 bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-xl"><Flame className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Longest Streak</p>
                      <p className="text-xl font-black">{Math.max(longestStreak, streak)} <span className="text-sm text-zinc-500 font-bold">Hari</span></p>
                    </div>
                  </div>
                  <div className="p-4 border-2 rounded-xl flex items-center gap-4 bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl"><Zap className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Most XP / Day</p>
                      <p className="text-xl font-black">{mostXpInDay.toLocaleString('id-ID')} <span className="text-sm text-zinc-500 font-bold">XP</span></p>
                    </div>
                  </div>
                  <div className="p-4 border-2 rounded-xl flex items-center gap-4 bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Perfect Lessons</p>
                      <p className="text-xl font-black">{totalPerfectLessons} <span className="text-sm text-zinc-500 font-bold">Unit</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Achievements List --- */}
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Daftar Pencapaian
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach: any, index: number) => (
                  <motion.div 
                    key={ach.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex flex-col gap-3 p-5 border-2 rounded-2xl bg-card ${ach.unlocked ? 'border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow' : 'border-zinc-100 dark:border-zinc-800 opacity-70 bg-zinc-50/50 dark:bg-zinc-900/50'}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon Badge */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-b-4 ${ach.unlocked ? ach.color : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700'}`}>
                        {ach.unlocked ? <ach.icon className="w-7 h-7" fill="currentColor" /> : <Lock className="w-7 h-7" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-base truncate pr-2 leading-tight">{ach.title}</h3>
                          {ach.target > 1 && <span className="text-[10px] font-bold text-zinc-400 shrink-0 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">Lvl {ach.level}</span>}
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{ach.desc}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {ach.target > 1 && (
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${ach.unlocked ? 'bg-yellow-400' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          style={{ width: `${Math.min(100, Math.max(0, (ach.progress / ach.target) * 100))}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- AVATAR PICKER MODAL --- */}
      {isAvatarModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
          onClick={() => setIsAvatarModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Pilih Avatar</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="text-zinc-500 hover:text-zinc-700"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              {AVATARS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { updateProfile({ avatarUrl: url }); setIsAvatarModalOpen(false); toast.success("Avatar diperbarui!"); }}
                  className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all hover:scale-110 ${avatarUrl === url ? 'border-blue-500 shadow-lg' : 'border-transparent'}`}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => { updateProfile({ avatarUrl: null }); setIsAvatarModalOpen(false); }}
                className={`w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-4 transition-all hover:scale-110 ${!avatarUrl ? 'border-blue-500 shadow-lg' : 'border-transparent'}`}
              >
                <User className="w-8 h-8 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

