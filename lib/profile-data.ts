import {
  Flame,
  Zap,
  Trophy,
  BookOpen,
  Moon,
  Sunrise,
  ShieldCheck,
  Bug,
  Medal,
  Calendar,
  LucideIcon
} from "lucide-react";

export interface AchievementData {
  id: string;
  title: string;
  desc: string;
  level: number;
  maxLevel: number;
  progress: number;
  target: number;
  icon: LucideIcon;
  color: string;
  unlocked: boolean;
}

export const getLevelProgress = (currentValue: number, targets: number[]) => {
  let level = 0;
  for (const t of targets) {
    if (currentValue >= t) level++;
    else break;
  }
  const nextTarget = targets[Math.min(level, targets.length - 1)];
  return { level, target: nextTarget, maxLevel: targets.length };
};

export const getAchievementsData = ({
  streak,
  xp,
  completedLessonIds,
  nocturnalCount,
  earlyBirdCount,
  unlockedAchievements,
  earnedBadgesCount = 0,
  perfectWeeksCount = 0
}: {
  streak: number;
  xp: number;
  completedLessonIds: string[];
  nocturnalCount: number;
  earlyBirdCount: number;
  unlockedAchievements: string[];
  earnedBadgesCount?: number;
  perfectWeeksCount?: number;
}): AchievementData[] => {
  const wildfireData = getLevelProgress(streak, [3, 5, 10, 15, 30, 50, 100, 150, 200, 365]);
  const sageData = getLevelProgress(xp, [1000, 3000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 1000000]);
  const scholarData = getLevelProgress(completedLessonIds.length, [5, 10, 25, 50, 100]);
  const nocturnalData = getLevelProgress(nocturnalCount, [1, 5, 10, 25, 50]);
  const earlyBirdData = getLevelProgress(earlyBirdCount, [1, 5, 10, 25, 50]);
  const badgeCollectorData = getLevelProgress(earnedBadgesCount, [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
  const perfectWeekData = getLevelProgress(perfectWeeksCount, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  return [
    { 
      id: "wildfire", 
      title: "Wildfire", 
      desc: `Mencapai ${wildfireData.target} hari streak berturut-turut`, 
      level: Math.max(1, wildfireData.level), 
      maxLevel: wildfireData.maxLevel, 
      progress: streak, 
      target: wildfireData.target,
      icon: Flame, 
      color: "text-orange-500 bg-orange-100 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
      unlocked: wildfireData.level > 0
    },
    { 
      id: "sage", 
      title: "Sage", 
      desc: `Mendapatkan total ${sageData.target.toLocaleString('id-ID')} XP`, 
      level: Math.max(1, sageData.level), 
      maxLevel: sageData.maxLevel, 
      progress: xp, 
      target: sageData.target, 
      icon: Zap, 
      color: "text-blue-500 bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
      unlocked: sageData.level > 0
    },
    { 
      id: "scholar", 
      title: "Scholar", 
      desc: `Menyelesaikan ${scholarData.target} Unit pelajaran`, 
      level: Math.max(1, scholarData.level), 
      maxLevel: scholarData.maxLevel, 
      progress: completedLessonIds.length, 
      target: scholarData.target, 
      icon: BookOpen, 
      color: "text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      unlocked: scholarData.level > 0
    },
    { 
      id: "winner", 
      title: "Winner", 
      desc: "Juara #1 di Leaderboard Mingguan", 
      level: 1, 
      maxLevel: 1, 
      progress: 0, 
      target: 1, 
      icon: Trophy, 
      color: "text-yellow-500 bg-yellow-100 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
      unlocked: false
    },
    { 
      id: "nocturnal", 
      title: "Nocturnal", 
      desc: `Menyelesaikan ${nocturnalData.target} soal di keheningan malam (00:00 - 04:59)`, 
      level: Math.max(1, nocturnalData.level), 
      maxLevel: nocturnalData.maxLevel, 
      progress: nocturnalCount, 
      target: nocturnalData.target,
      icon: Moon, 
      color: "text-indigo-400 bg-indigo-950 border-indigo-800",
      unlocked: nocturnalData.level > 0
    },
    { 
      id: "early-bird", 
      title: "Early Bird", 
      desc: `Mengerjakan ${earlyBirdData.target} materi saat pagi hari (06:00 - 09:00)`, 
      level: Math.max(1, earlyBirdData.level), 
      maxLevel: earlyBirdData.maxLevel, 
      progress: earlyBirdCount, 
      target: earlyBirdData.target, 
      icon: Sunrise, 
      color: "text-amber-500 bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
      unlocked: earlyBirdData.level > 0
    },
    { 
      id: "flawless", 
      title: "Flawless Victory", 
      desc: "Menyelesaikan sebuah unit materi tanpa pernah salah men-submit kode.", 
      level: 1, 
      maxLevel: 1, 
      progress: unlockedAchievements.includes('flawless') ? 1 : 0, 
      target: 1, 
      icon: ShieldCheck, 
      color: "text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      unlocked: unlockedAchievements.includes('flawless')
    },
    { 
      id: "bug-squasher", 
      title: "Bug Squasher", 
      desc: "Menemukan dan melaporkan bug pada sistem ITSDojo.", 
      level: 1, 
      maxLevel: 1, 
      progress: unlockedAchievements.includes('bug-squasher') ? 1 : 0, 
      target: 1, 
      icon: Bug, 
      color: "text-rose-500 bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
      unlocked: unlockedAchievements.includes('bug-squasher')
    },
    {
      id: "badge-collector",
      title: "Badge Collector",
      desc: `Mengumpulkan ${badgeCollectorData.target} Lencana Bulanan`,
      level: Math.max(1, badgeCollectorData.level),
      maxLevel: badgeCollectorData.maxLevel,
      progress: earnedBadgesCount,
      target: badgeCollectorData.target,
      icon: Medal,
      color: "text-purple-500 bg-purple-100 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
      unlocked: badgeCollectorData.level > 0
    },
    {
      id: "perfect-week",
      title: "Perfect Week",
      desc: `Mencapai ${perfectWeekData.target} minggu aktif penuh tanpa bolong`,
      level: Math.max(1, perfectWeekData.level),
      maxLevel: perfectWeekData.maxLevel,
      progress: perfectWeeksCount,
      target: perfectWeekData.target,
      icon: Calendar,
      color: "text-teal-500 bg-teal-100 border-teal-200 dark:bg-teal-950 dark:border-teal-800",
      unlocked: perfectWeekData.level > 0
    }
  ];
};
