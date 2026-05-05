"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store";
import { usePathname } from "next/navigation";
import { formatLocalDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { AlertCircle, Bell, BellOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StreakReminder() {
  const { streak, activityHistory, streakFreezeCount } = useUserStore();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Hanya tampilkan di halaman belajar atau target harian
  const isRelevantPage = pathname === "/learn" || pathname === "/goals";

  useEffect(() => {
    // 1. Cek Aktivitas Hari Ini
    const today = formatLocalDate(new Date());
    const hasActivityToday = activityHistory.some(h => h.date === today && h.count > 0);
    
    // 2. Cek Waktu (Tampilkan peringatan jika sudah malam, misal > jam 20:00)
    const checkTime = () => {
      const hour = new Date().getHours();
      if (!hasActivityToday && hour >= 20 && streak > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 60000); // Cek setiap menit

    // 3. Cek Status Notifikasi Browser
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    return () => clearInterval(timer);
  }, [activityHistory, streak]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser Anda tidak mendukung notifikasi.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      toast.success("Notifikasi pengingat diaktifkan!");
      
      // Kirim notifikasi percobaan
      new Notification("ITSDojo", {
        body: "Pengingat streak berhasil diaktifkan! Kami akan mengingatkanmu jika streak dalam bahaya.",
        icon: "/favicon.ico"
      });
    } else {
      toast.error("Izin notifikasi ditolak.");
    }
  };

  if (!isRelevantPage) return null;

  return (
    <>
      {/* 1. STREAK RECOVERY WARNING (UI Banner) */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 md:bottom-20 md:left-auto md:right-8 md:w-96 z-50"
          >
            <div className="bg-orange-500 text-white p-4 rounded-2xl shadow-2xl flex gap-4 items-start border-2 border-orange-400">
              <div className="bg-white/20 p-2 rounded-xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">⚠️ Hampir Kehilangan Streak!</h4>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">
                  Kamu belum belajar hari ini. Segera selesaikan satu materi sebelum tengah malam untuk menjaga {streak} hari streak-mu!
                </p>
                {streakFreezeCount > 0 && (
                  <div className="mt-2 text-[10px] bg-white/20 w-fit px-2 py-0.5 rounded-full font-bold">
                    Tersedia {streakFreezeCount} Streak Freeze
                  </div>
                )}
              </div>
              <button onClick={() => setShowWarning(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NOTIFICATION PERMISSION TOGGLE (Widget kecil di pojok) */}
      {!notificationsEnabled && (
        <div className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-40">
          <button 
            onClick={requestNotificationPermission}
            className="group flex items-center gap-2 p-3 bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-blue-700"
            title="Aktifkan Pengingat Streak"
          >
            <BellOff className="w-5 h-5" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 text-xs font-bold pr-2">
              Ingatkan Streak
            </span>
          </button>
        </div>
      )}
    </>
  );
}
