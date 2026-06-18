import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { HelpCircle, Calendar, Trophy } from "lucide-react";

export interface LeaderboardUser {
  userId?: string;
  name: string;
  score?: number;
  xp?: number;
  rank?: number;
  avatar: string;
}

interface LeaderboardWidgetProps {
  topUsers: LeaderboardUser[];
  currentUserId: string;
  currentUserName: string;
  currentUserXp: number;
  currentUserRank: number;
}

export const LeaderboardWidget = ({ 
  topUsers, 
  currentUserId, 
  currentUserName, 
  currentUserXp, 
  currentUserRank 
}: LeaderboardWidgetProps) => {
  // Show top 3 or all topUsers if less than 3
  const displayedTop = topUsers.slice(0, 3);
  const isUserInTop3 = currentUserRank <= 3;

  // Hitung sisa waktu ke Hari Minggu 23:59:59 WIB secara dinamis
  const getRemainingTime = () => {
    const now = new Date();
    const nextSunday = new Date();
    const currentDay = now.getDay();
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(23, 59, 59, 999);
    
    if (nextSunday.getTime() <= now.getTime()) {
      nextSunday.setDate(nextSunday.getDate() + 7);
    }
    
    const diffMs = nextSunday.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays === 0) {
      return `${diffHours} Jam`;
    }
    return `${diffDays} Hari ${diffHours} Jam`;
  };

  return (
    <Card className="hidden lg:block p-4 rounded-2xl border-2">
      {/* Header dengan Hover Informasi (Opsi A) - Di-hide sementara sesuai instruksi */}
      <div className="flex items-center gap-1.5 mb-4">
        <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Papan Peringkat</h3>
        {/* 
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button className="text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none">
              <HelpCircle className="w-4 h-4 cursor-help" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent 
            side="top" 
            align="start" 
            className="w-72 rounded-2xl p-4 z-[120] border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 flex flex-col gap-3.5 select-none text-left"
          >
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white">Tentang Liga ITSDojo</span>
              <span className="text-[11px] text-zinc-500">Kompetisi persahabatan antar mahasiswa untuk membangun kebiasaan belajar.</span>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

            <div className="flex items-start gap-2 text-xs">
              <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Waktu Tersisa</span>
                <span className="text-[11px] text-zinc-500 font-semibold text-blue-600 dark:text-blue-400">Reset: {getRemainingTime()}</span>
              </div>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Reward Akhir Pekan</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500 font-black w-4">#1</span>
                  <span className="text-zinc-600 dark:text-zinc-400">👑 +100 Gems & Lencana Emas</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400 font-bold w-4">#2</span>
                  <span className="text-zinc-650 dark:text-zinc-400">🥈 +50 Gems & Lencana Perak</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-700 font-bold w-4">#3</span>
                  <span className="text-zinc-650 dark:text-zinc-400">🥉 +25 Gems & Lencana Perunggu</span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        */}
      </div>

      <div className="space-y-3">
        {displayedTop.map((user, idx) => {
          const isMe = user.userId === currentUserId;
          return (
            <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl ${isMe ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50" : ""}`}>
              <div className="font-bold text-zinc-400 w-6">{idx + 1}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.avatar}`}>{user.name.charAt(0)}</div>
              <div className="flex-1 font-bold text-sm truncate">{user.name}</div>
              <div className="text-xs font-bold text-zinc-400">
                {isMe ? <AnimatedNumber value={currentUserXp} /> : (user.score ?? user.xp ?? 0)} XP
              </div>
            </div>
          );
        })}

        {!isUserInTop3 && (
          <>
            <div className="flex justify-center py-1">
              <div className="w-1 h-1 bg-zinc-300 rounded-full mx-0.5" />
              <div className="w-1 h-1 bg-zinc-300 rounded-full mx-0.5" />
              <div className="w-1 h-1 bg-zinc-300 rounded-full mx-0.5" />
            </div>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
              <div className="font-bold text-zinc-400 w-6">{currentUserRank}</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-blue-200 text-blue-700">{currentUserName.charAt(0)}</div>
              <div className="flex-1 font-bold text-sm truncate">{currentUserName} (Kamu)</div>
              <div className="text-xs font-bold text-zinc-400">
                <AnimatedNumber value={currentUserXp} /> XP
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
