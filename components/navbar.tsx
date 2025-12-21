"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store";
import { Trophy, Flame } from "lucide-react"; // Ikon untuk gamifikasi

export function Navbar() {
  const { xp, level, xpToNextLevel, name } = useUserStore();

  // Hitung persentase progress level
  const progress = Math.min((xp / xpToNextLevel) * 100, 100);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-blue-600">ITSDojo</span>
        </Link>

        {/* Navigasi Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/courses" className="transition-colors hover:text-foreground/80">
            Courses
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground/80">
            Leaderboard
          </Link>
        </nav>

        {/* User Stats (Gamifikasi) */}
        <div className="flex items-center gap-4">
          
          {/* Daily Streak (Contoh statis dulu) */}
          <div className="hidden md:flex items-center gap-1 text-orange-500 font-bold text-sm">
            <Flame className="h-4 w-4 fill-current" />
            <span>3</span>
          </div>

          {/* XP & Level Bar */}
          <div className="flex flex-col items-end w-32 md:w-40">
            <div className="flex justify-between w-full text-xs mb-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Lvl {level}</span>
              <span className="text-zinc-500">{Math.floor(xp)} XP</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Avatar / Profile (Placeholder) */}
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200">
            {name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}