import { users } from "@/db/schema";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";

export interface StreakEvaluationResult {
  streak: number;
  lastActiveDate: string;
  freezeCount: number;
  freezeUsed: number;
  isReset: boolean;
  frozenDates: string[];
}

/**
 * Helper sentral untuk mengevaluasi logika Streak harian pengguna.
 * Pure function ini tidak melakukan operasi database, sehingga aman dipanggil
 * di dalam transaction atau retry loop (OCC).
 * 
 * Aturan Bisnis:
 * 1. Jika diff === 0: Sudah klaim hari ini, kembalikan nilai apa adanya.
 * 2. Jika diff === 1: Lanjut belajar dari kemarin, tambah streak + 1.
 * 3. Jika diff > 1 (Bolong):
 *    - Jika punya streak_freeze: Konsumsi freeze sejumlah hari bolong (jika cukup). Pertahankan streak, lalu tambah + 1.
 *    - Jika tidak punya/kurang: Streak hangus, reset ke 1.
 * 
 * @param currentStreak Streak saat ini
 * @param lastActiveDate Tanggal terakhir aktif (YYYY-MM-DD)
 * @param freezeCount Jumlah item Streak Freeze yang dimiliki
 * @param timezoneOffsetMinutes Offset zona waktu lokal pengguna dari UTC (opsional). Jika tidak diberikan, gunakan UTC server.
 */
export function evaluateStreak(
  currentStreak: number,
  lastActiveDate: string | null | undefined,
  freezeCount: number,
  timezoneOffsetMinutes?: number
): StreakEvaluationResult {
  const now = new Date();
  
  // Normalisasi ke tanggal lokal pengguna (atau fallback ke UTC)
  let todayStr: string;
  if (timezoneOffsetMinutes !== undefined) {
    const localTime = new Date(now.getTime() - timezoneOffsetMinutes * 60000);
    todayStr = localTime.toISOString().split('T')[0];
  } else {
    // Fallback yang konsisten: YYYY-MM-DD dalam Asia/Jakarta
    todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  }

  if (!lastActiveDate || lastActiveDate === '') {
    return { streak: 1, lastActiveDate: todayStr, freezeCount, freezeUsed: 0, isReset: false };
  }

  // Corrupted state fix: If streak is 0 but lastActiveDate is today, it's a new streak
  if (lastActiveDate === todayStr && currentStreak === 0) {
    return { streak: 1, lastActiveDate: todayStr, freezeCount, freezeUsed: 0, isReset: false };
  }

  if (lastActiveDate === todayStr) {
    // Sudah klaim hari ini
    return { streak: currentStreak, lastActiveDate: todayStr, freezeCount, freezeUsed: 0, isReset: false };
  }

  // Helper normalisasi tengah malam UTC untuk kalkulasi hari
  const normalizeToMidnightUTC = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  };

  const todayMidnight = normalizeToMidnightUTC(todayStr);
  const lastActiveMidnight = normalizeToMidnightUTC(lastActiveDate);
  const diffMs = todayMidnight.getTime() - lastActiveMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let newStreak = currentStreak;
  let newFreezeCount = freezeCount;
  let freezeUsed = 0;
  let isReset = false;
  const frozenDates: string[] = [];

  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    // Pengguna bolong / absen!
    let missedDays = diffDays - 1;

    // Evaluasi dari hari bolong pertama hingga kemarin secara berurutan
    for (let i = 1; i <= missedDays; i++) {
      const missedDate = new Date(lastActiveMidnight.getTime() + i * 24 * 60 * 60 * 1000);
      const missedDateStr = missedDate.toLocaleDateString('en-CA', { timeZone: 'UTC' }); // Since it's from UTC midnight

      if (newFreezeCount > 0) {
        newFreezeCount -= 1;
        freezeUsed += 1;
        frozenDates.push(missedDateStr);
      } else {
        // Freeze habis!
        newStreak = 0;
        isReset = true;
        break; // Stop evaluating, streak is broken
      }
    }

    if (isReset) {
      newStreak = 1; // Mulai streak baru hari ini
    } else {
      newStreak += 1; // Pertahankan streak sebelumnya dan tambah untuk hari ini
    }
  } else {
     // Time travel (tanggal mundur) fallback
     newStreak = 1;
  }

  return {
    streak: newStreak,
    lastActiveDate: todayStr,
    freezeCount: newFreezeCount,
    freezeUsed,
    isReset,
    frozenDates
  };
}

export async function updateUserGameFinished(
  userId: string,
  xpAdded: number,
  profileXpAdded: number,
  gemsAdded: number
) {
  let retries = 3;
  while (retries > 0) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          xp: true,
          profileXp: true,
          gems: true,
          level: true,
          streak: true,
          gamificationData: true,
        },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      const gData: any = user.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;

      // 1. Evaluate streak
      const oldLastActiveDate = gData.lastActiveDate;
      const streakResult = evaluateStreak(user.streak, gData.lastActiveDate, gData.streakFreezeCount || 0);
      
      let newStreak = streakResult.streak;
      let newLastActiveDate = streakResult.lastActiveDate;
      gData.streakFreezeCount = streakResult.freezeCount;

      // 2. Track activity/freeze usage in history
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      let history = gData.activityHistory || [];
      const todayIndex = history.findIndex((h: any) => h.date === today);
      
      const xpToReport = profileXpAdded > 0 ? profileXpAdded : xpAdded;
      if (todayIndex !== -1) {
        history[todayIndex].count += 1;
        history[todayIndex].xpEarned = (history[todayIndex].xpEarned || 0) + xpToReport;
      } else {
        history.push({
          date: today,
          count: 1,
          xpEarned: xpToReport
        });
      }

      if (streakResult.frozenDates && streakResult.frozenDates.length > 0) {
        streakResult.frozenDates.forEach((fDate: string) => {
          const existingIndex = history.findIndex((h: any) => h.date === fDate);
          if (existingIndex !== -1) {
            history[existingIndex].freezeUsed = true;
          } else {
            history.push({ date: fDate, count: 0, xpEarned: 0, freezeUsed: true });
          }
        });
      }

      // 3. Update mostXpInDay
      const currentTodayEntry = history.find((h: any) => h.date === today);
      gData.mostXpInDay = Math.max(gData.mostXpInDay || 0, currentTodayEntry ? currentTodayEntry.xpEarned : 0);
      gData.activityHistory = history;
      gData.lastActiveDate = newLastActiveDate;

      // 4. Update longest streak
      gData.longestStreak = Math.max(gData.longestStreak || 0, newStreak);

      // 5. Daily goals check for streak
      let extraGems = 0;
      if (gData.dailyGoals && Array.isArray(gData.dailyGoals)) {
        gData.dailyGoals.forEach((goal: any) => {
          if (!goal.isCompleted && goal.type === 'streak' && oldLastActiveDate !== newLastActiveDate) {
            goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + 1);
            if (goal.currentProgress >= goal.targetValue) {
              goal.isCompleted = true;
              extraGems += goal.reward || 0;
            }
          }
        });
      }

      // 6. Level up logic if profileXp is added
      let newLevel = user.level;
      let newProfileXp = user.profileXp + profileXpAdded;
      if (profileXpAdded > 0) {
        let xpToNextLevel = 100;
        for (let i = 1; i <= newLevel; i++) {
          if (i > 1) xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
        }
        let levelUpGems = 0;
        while (newProfileXp >= xpToNextLevel) {
          newLevel += 1;
          levelUpGems += 50;
          xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
        }
        gemsAdded += levelUpGems;
      }

      const newGems = user.gems + gemsAdded + extraGems;
      const newXp = user.xp + xpAdded;

      gData.lastUpdated = Date.now();

      const updateCondition = currentLastUpdated > 0
        ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
        : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;

      const result = await db
        .update(users)
        .set({
          xp: newXp,
          profileXp: newProfileXp,
          gems: newGems,
          level: newLevel,
          streak: newStreak,
          gamificationData: gData,
        })
        .where(and(eq(users.id, userId), updateCondition))
        .returning({ id: users.id });

      if (result.length > 0) {
        const streakEarnedNow = oldLastActiveDate !== newLastActiveDate;
        return { success: true, streakEarnedNow };
      }

      retries--;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 20));
      }
    } catch (err) {
      console.error(`Error updating user game finished rewards for ${userId}:`, err);
      retries--;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 20));
      }
    }
  }

  return { success: false, error: "OCC Conflict" };
}
