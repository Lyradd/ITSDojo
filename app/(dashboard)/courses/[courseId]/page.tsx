"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn, name, level, xp, xpToNextLevel, addXp } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cek status login. Jika belum login, tendang ke /login
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  // Tampilkan loading sebentar saat redirect agar tidak glitch
  if (!isMounted || !isLoggedIn) {
    return null; 
  }

  return (
    <div className="container mx-auto max-w-4xl p-8 flex flex-col items-center gap-8">
      {/* Kartu Status Player */}
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h1 className="text-2xl font-bold mb-2">Halo, {name}!</h1>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium">
            <span>Level {level}</span>
            <span className="text-zinc-500">{xp} / {Math.floor(xpToNextLevel)} XP</span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Area Aksi Gamifikasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <Button onClick={() => addXp(20)} className="h-12 text-lg">
          Selesaikan Quiz (+20 XP)
        </Button>
        <Button variant="outline" onClick={() => addXp(50)} className="h-12 text-lg">
          Misi Harian (+50 XP)
        </Button>
      </div>
      
      <p className="text-sm text-zinc-500 mt-8">
        Selamat datang di Dashboard ITSDojo. Pilih menu di atas untuk mulai belajar.
      </p>
    </div>
  );
}