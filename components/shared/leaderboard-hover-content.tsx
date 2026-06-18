import { Trophy, BookOpen, Target, Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeaderboardHoverContentProps {
  userName: string;
  userRank: number;
  userXp: number;
  topUsers: any[];
  isCurrentUser: boolean;
  completedLessonsCount?: number;
  completedGoalsCount?: number;
  totalGoalsCount?: number;
  streakCount?: number;
}

export function LeaderboardHoverContent({ 
  userName, 
  userRank, 
  userXp, 
  topUsers,
  isCurrentUser,
  completedLessonsCount = 0,
  completedGoalsCount = 0,
  totalGoalsCount = 3,
  streakCount = 0
}: LeaderboardHoverContentProps) {
  
  // Menentukan statistik (menggunakan data asli jika user aktif, atau estimasi jika user lain)
  const lessons = isCurrentUser ? completedLessonsCount : Math.max(1, Math.round(userXp / 45));
  const streak = isCurrentUser ? streakCount : Math.max(1, (5 - userRank) + 1);
  const goalsMet = isCurrentUser ? completedGoalsCount : Math.min(3, Math.max(1, 3 - (userRank % 2)));
  const goalsTotal = isCurrentUser ? totalGoalsCount : 3;

  // Rank trend determination
  let trendIcon = <Minus className="w-3 h-3 text-zinc-400" />;
  let trendText = "Posisi Stabil";
  let trendColor = "text-zinc-400";
  if (userRank === 1) {
    trendText = "Mempertahankan Takhta";
    trendColor = "text-amber-500";
  } else if (userRank === 2) {
    trendIcon = <TrendingUp className="w-3 h-3 text-green-500" />;
    trendText = "Naik 1 peringkat minggu ini";
    trendColor = "text-green-500";
  } else if (userRank === 3) {
    trendIcon = <TrendingDown className="w-3 h-3 text-red-500" />;
    trendText = "Turun 1 peringkat minggu ini";
    trendColor = "text-red-500";
  } else {
    trendIcon = <TrendingUp className="w-3 h-3 text-green-500" />;
    trendText = "Naik 2 peringkat minggu ini";
    trendColor = "text-green-500";
  }

  // Competitor Gaps
  const userAbove = userRank > 1 && topUsers.length >= userRank - 1 ? topUsers[userRank - 2] : null;
  const userBelow = topUsers.length > userRank ? topUsers[userRank] : null;

  const gapAbove = userAbove ? (userAbove.score ?? userAbove.xp ?? 0) - userXp : 0;
  const gapBelow = userBelow ? userXp - (userBelow.score ?? userBelow.xp ?? 0) : 0;

  return (
    <div className="w-72 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 flex flex-col gap-3.5 select-none text-left">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm text-zinc-900 dark:text-white truncate max-w-[170px]">{userName}</span>
          <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full shrink-0">
            <Trophy className="w-3 h-3 fill-current" />
            Rank #{userRank}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${trendColor}`}>
          {trendIcon}
          <span>{trendText}</span>
        </div>
      </div>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Rangkuman Aktivitas Belajar */}
      <div className="flex flex-col gap-2.5">
        <h4 className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Aktivitas Minggu Ini</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-650 dark:text-zinc-400 font-bold">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Materi Selesai
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-100">{lessons} Materi</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-650 dark:text-zinc-400 font-bold">
              <Target className="w-4 h-4 text-emerald-500" />
              Misi Harian Selesai
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-100">{goalsMet} / {goalsTotal} Misi</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-650 dark:text-zinc-400 font-bold">
              <Flame className="w-4 h-4 text-orange-500 fill-current animate-pulse" />
              Streak Konsistensi
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-100">{streak} Hari Aktif</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Competition Gap */}
      <div className="flex flex-col gap-1.5">
        <h4 className="text-[10px] font-black uppercase text-zinc-455 dark:text-zinc-500 tracking-wider">Posisi Kompetisi</h4>
        <div className="space-y-1 text-xs text-zinc-550 dark:text-zinc-400">
          {userAbove ? (
            <p className="flex items-center gap-1.5">
              <span className="text-blue-500">🎯</span>
              <span>Butuh <strong className="text-zinc-750 dark:text-zinc-200">+{gapAbove} XP</strong> untuk mengejar {userAbove.name.split(' ')[0]}</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-amber-500 font-bold">
              <span>👑</span>
              <span>Pemimpin papan peringkat minggu ini!</span>
            </p>
          )}
          {userBelow && (
            <p className="flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Unggul <strong className="text-zinc-750 dark:text-zinc-200">+{gapBelow} XP</strong> dari {userBelow.name.split(' ')[0]}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
