"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store"; // Pastikan path ini benar
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar"; // Jika Navbar sudah dibuat

export default function Home() {
  const router = useRouter();
  
  // Ambil state dari store
  const { isLoggedIn, name, level, xp, xpToNextLevel, addXp } = useUserStore();
  
  // State lokal untuk memastikan hydration selesai (mencegah error "Text content does not match")
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cek Login: Jika belum login, lempar ke /login
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  // Tampilkan layar kosong sementara selagi proses redirect
  if (!isMounted || !isLoggedIn) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Jika sudah login, tampilkan Dashboard
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Pasang Navbar di sini jika tidak dipasang di layout.tsx */}
      <Navbar /> 

      <main className="container mx-auto max-w-4xl p-8 flex flex-col items-center gap-8">
        {/* Kartu Status Player */}
        <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h1 className="text-2xl font-bold mb-2">Halo, {name}!</h1>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Level {level}</span>
              <span className="text-zinc-500">{xp} / {Math.floor(xpToNextLevel)} XP</span>
            </div>
            
            <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tombol Aksi Gamifikasi */}
        <div className="flex gap-4">
          <Button onClick={() => addXp(20)}>
            Selesaikan Quiz (+20 XP)
          </Button>
          <Button variant="outline" onClick={() => addXp(50)}>
            Selesaikan Misi (+50 XP)
          </Button>
        </div>
      </main>
    </div>
  );
}