"use server";

import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { evaluateStreak } from "@/lib/gamification/streak";

export async function buyShopItemAction(type: string, cost: number) {
  let retries = 3;
  while (retries > 0) {
    try {
      const session = await getSession();
      if (!session || !session.userId) return { success: false, error: "Unauthorized" };

      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
        columns: { gems: true, gamificationData: true }
      });

      if (!user) return { success: false, error: "User not found" };

      if (user.gems < cost) return { success: false, error: "Saldo gems tidak cukup" };

      const gData: any = user.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;
      let newFreeze = gData.streakFreezeCount || 0;
      let newShield = gData.hasShieldPack || false;
      let newMiner = gData.hasGemMiner || false;
      let newMult = gData.xpMultiplier || 1;
      let newMultTime = gData.multiplierEndTime || null;
      let slots = gData.unlockedInventorySlotIds || [];

      const newPurchase = {
        id: Math.random().toString(36).substring(7) + Date.now(),
        type, cost, date: new Date().toISOString(),
        itemName: type === "freeze" ? "Streak Freeze" : type === "multiplier" ? "XP Booster (1 Jam)" : type === "shield-3x" ? "Shield Pack" : type === "gem-miner" ? "Gem Miner (Permanen)" : "Slot Inventori"
      };
      const history = [newPurchase, ...(gData.purchaseHistory || [])].slice(0, 50);

      if (type === "freeze") {
        if (newFreeze >= 3) return { success: false, error: "Slot penuh" };
        newFreeze += 1;
      } else if (type === "multiplier") {
        const durationMs = 60 * 60 * 1000;
        newMult = 2;
        newMultTime = (newMultTime && newMultTime > Date.now() ? newMultTime : Date.now()) + durationMs;
      } else if (type === "shield-3x") {
        if (newShield) return { success: false, error: "Sudah punya Shield" };
        newShield = true;
      } else if (type === "gem-miner") {
        if (newMiner) return { success: false, error: "Sudah punya Gem Miner" };
        newMiner = true;
      } else if (type.startsWith("slot-")) {
        if (slots.includes(type)) return { success: false, error: "Slot sudah terbuka" };
        slots.push(type);
      } else {
        return { success: false, error: "Item tidak valid" };
      }

      gData.streakFreezeCount = newFreeze;
      gData.hasShieldPack = newShield;
      gData.hasGemMiner = newMiner;
      gData.xpMultiplier = newMult;
      gData.multiplierEndTime = newMultTime;
      gData.unlockedInventorySlotIds = slots;
      gData.purchaseHistory = history;
      gData.lastUpdated = Date.now();

      const updateCondition = currentLastUpdated > 0
          ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
          : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;

      const updatedResult = await db.update(users)
        .set({ 
          gems: sql`${users.gems} - ${cost}`,
          gamificationData: gData 
        })
        .where(and(
          eq(users.id, session.userId), 
          gte(users.gems, cost),
          updateCondition
        ))
        .returning({ gems: users.gems });

      if (updatedResult.length > 0) {
        return { 
          success: true, 
          newGems: updatedResult[0].gems, 
          gamificationData: gData 
        };
      }
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20)); // Jitter backoff
      }
    } catch (err) {
      console.error("Shop Error:", err);
      return { success: false, error: "Internal Error" };
    }
  }
  return { success: false, error: "Transaksi gagal karena konflik data bersamaan. Saldo tidak terpotong, silakan coba lagi." };
}

export async function completeLessonAction(lessonIdStr: string, isPerfect: boolean, baseRewardXp: number, baseRewardGems: number) {
  let retries = 3;
  while (retries > 0) {
    try {
      const session = await getSession();
      if (!session || !session.userId) return { success: false, error: "Unauthorized" };

      const lessonId = parseInt(lessonIdStr);
      if (isNaN(lessonId)) return { success: false, error: "Invalid lesson ID" };

      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
        columns: { xp: true, profileXp: true, gems: true, level: true, streak: true, gamificationData: true, id: true }
      });

      if (!user) return { success: false, error: "User not found" };

      const existingProgress = await db.query.userProgress.findFirst({
        where: and(eq(userProgress.userId, session.userId), eq(userProgress.lessonId, lessonId))
      });

      const isNew = !existingProgress;

      let isReviewedToday = false;
      if (!isNew && existingProgress.completedAt) {
        const completedDate = new Date(existingProgress.completedAt);
        const todayDate = new Date();
        isReviewedToday = completedDate.getFullYear() === todayDate.getFullYear() &&
                          completedDate.getMonth() === todayDate.getMonth() &&
                          completedDate.getDate() === todayDate.getDate();
      }

      const gData: any = user.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;
      const hasMiner = gData.hasGemMiner || false;
      const mult = gData.xpMultiplier || 1;
      const multTime = gData.multiplierEndTime || null;
      const isMultActive = multTime && multTime > Date.now();

      let earnedXp = isNew ? (baseRewardXp || 50) : (!isReviewedToday ? 10 : 0);
      if (isMultActive) earnedXp *= mult;

      let earnedGems = isNew ? (baseRewardGems || 10) : 0;
      if (hasMiner) earnedGems *= 2;



      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); 
      let history = gData.activityHistory || [];
      const todayIndex = history.findIndex((h: any) => h.date === today);
      if (todayIndex !== -1) {
        history[todayIndex].count += 1;
        history[todayIndex].xpEarned = (history[todayIndex].xpEarned || 0) + earnedXp;
      } else {
        history.push({ date: today, count: 1, xpEarned: earnedXp });
      }

      // Update mostXpInDay
      const currentTodayEntry = history.find((h: any) => h.date === today);
      gData.mostXpInDay = Math.max(gData.mostXpInDay || 0, currentTodayEntry ? currentTodayEntry.xpEarned : 0);

      // --- STREAK EVALUATION ---
      const streakResult = evaluateStreak(user.streak, gData.lastActiveDate, gData.streakFreezeCount || 0);
      let newStreak = streakResult.streak;
      let newLastActiveDate = streakResult.lastActiveDate;
      gData.streakFreezeCount = streakResult.freezeCount;

      if (streakResult.frozenDates && streakResult.frozenDates.length > 0) {
        // Catat semua hari bolong yang berhasil dilindungi sebagai FROZEN di history
        streakResult.frozenDates.forEach((fDate: string) => {
          const existingIndex = history.findIndex((h: any) => h.date === fDate);
          if (existingIndex !== -1) {
            history[existingIndex].freezeUsed = true;
          } else {
            history.push({ date: fDate, count: 0, xpEarned: 0, freezeUsed: true });
          }
        });
      }

      // --- DAILY GOALS EVALUATION (Moved after streak to allow streak trigger) ---
      if (gData.dailyGoals && Array.isArray(gData.dailyGoals)) {
        gData.dailyGoals.forEach((goal: any) => {
          if (!goal.isCompleted) {
            if (goal.type === 'xp') {
              goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + earnedXp);
            } else if (goal.type === 'lesson') {
              goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + 1);
            } else if (goal.type === 'perfect' && isPerfect) {
              goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + 1);
            } else if (goal.type === 'streak' && gData.lastActiveDate !== newLastActiveDate) {
              // Jika lastActiveDate berubah hari ini, berarti streak telah "diperpanjang" (dimulai hari ini)
              goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + 1);
            }

            if (goal.currentProgress >= goal.targetValue) {
              goal.isCompleted = true;
              // Catatan: rewardXP dan rewardGems akan diklaim melalui fungsi claim, bukan otomatis di sini,
              // KECUALI jika ada field goal.reward yang bersifat legacy.
              earnedGems += goal.reward || 0; 
            }
          }
        });
      }

      let newLevel = user.level;
      let newXp = user.profileXp + earnedXp;
      let xpToNextLevel = 100;
      
      for (let i = 1; i <= newLevel; i++) {
          if (i > 1) xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
      }
      
      let levelUpGems = 0;
      while (newXp >= xpToNextLevel) {
          newLevel += 1;
          levelUpGems += 50;
          xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
      }
      
      earnedGems += levelUpGems;

      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) {
        gData.nocturnalCount = (gData.nocturnalCount || 0) + 1;
        gData.unlockedAchievements = gData.unlockedAchievements || [];
        if (!gData.unlockedAchievements.includes('nocturnal')) gData.unlockedAchievements.push('nocturnal');
      }
      if (hour >= 6 && hour <= 9) {
        gData.earlyBirdCount = (gData.earlyBirdCount || 0) + 1;
        gData.unlockedAchievements = gData.unlockedAchievements || [];
        if (!gData.unlockedAchievements.includes('early-bird')) gData.unlockedAchievements.push('early-bird');
      }

      gData.longestStreak = Math.max(gData.longestStreak || 0, newStreak);
      if (isPerfect) {
         gData.totalPerfectLessons = (gData.totalPerfectLessons || 0) + 1;
      }

      gData.activityHistory = history;
      gData.lastActiveDate = newLastActiveDate;
      gData.lastUpdated = Date.now();

      const newGems = user.gems + earnedGems;
      const newLeaderboardXp = user.xp + earnedXp;

      const updateCondition = currentLastUpdated > 0
          ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
          : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;

      const result = await db.update(users)
        .set({
            xp: newLeaderboardXp,
            profileXp: newXp,
            gems: newGems,
            level: newLevel,
            streak: newStreak,
            gamificationData: gData
        })
        .where(and(eq(users.id, session.userId), updateCondition))
        .returning({ id: users.id });

      if (result.length > 0) {
        // Hanya rekam progress lesson jika update XP/Gems ke user berhasil
        // Mencegah partial failure (stuck) jika OCC conflict gagal
        if (isNew) {
          await db.insert(userProgress).values({ userId: session.userId, lessonId }).onConflictDoNothing();
        } else if (!isReviewedToday) {
          await db.update(userProgress).set({ completedAt: new Date() }).where(and(eq(userProgress.userId, session.userId), eq(userProgress.lessonId, lessonId)));
        }

        return { 
            success: true, 
            earnedXp, 
            earnedGems, 
            isNew, 
            newLevel,
            newStreak,
            gamificationData: gData,
            newGems,
            newXp,
            newLeaderboardXp
        };
      }
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20)); // Jitter backoff
      }
    } catch (err) {
      console.error("Complete Lesson Error:", err);
      return { success: false, error: "Internal Error" };
    }
  }
  return { success: false, error: "Transaksi gagal karena konflik pembaruan data bersamaan. Silakan coba lagi." };
}

export async function resetLearningProgressAction() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    // Hapus seluruh progress lesson pengguna ini
    await db.delete(userProgress).where(eq(userProgress.userId, session.userId));

    // Revalidasi cache Next.js agar tidak menampilkan data usang
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error("Reset Progress Error:", err);
    return { success: false, error: "Internal Error" };
  }
}

// Master missions definition for server-side generation
const SERVER_MASTER_MISSIONS_POOL = [
  { id: 'acad-1', category: 'academic', type: 'lesson', title: 'Pemanasan Otak', description: 'Selesaikan 1 Materi Baru', targetValue: 1, rewardXP: 50, rewardGems: 10 },
  { id: 'acad-2', category: 'academic', type: 'perfect', title: 'Tanpa Celah', description: 'Dapatkan 1 Perfect Lesson', targetValue: 1, rewardXP: 100, rewardGems: 30 },
  { id: 'acad-3', category: 'academic', type: 'xp', title: 'Pengejar Ilmu', description: 'Raih 150 XP hari ini', targetValue: 150, rewardXP: 0, rewardGems: 25 },
  { id: 'comp-1', category: 'competitive', type: 'duel', title: 'Tantang Dunia', description: 'Mainkan 1x Brain Duel', targetValue: 1, rewardXP: 40, rewardGems: 15 },
  { id: 'comp-2', category: 'competitive', type: 'duel_win', title: 'Gladiator Dojo', description: 'Menang 1v1 Brain Duel', targetValue: 1, rewardXP: 100, rewardGems: 50 },
  { id: 'comp-3', category: 'competitive', type: 'leaderboard', title: 'Pemantau Peringkat', description: 'Cek Papan Peringkat', targetValue: 1, rewardXP: 20, rewardGems: 5 },
  { id: 'cons-1', category: 'consistency', type: 'login_early', title: 'Burung Pagi', description: 'Login sebelum jam 9 pagi', targetValue: 1, rewardXP: 30, rewardGems: 10 },
  { id: 'cons-2', category: 'consistency', type: 'streak', title: 'Kobarkan Api', description: 'Perpanjang Streak', targetValue: 1, rewardXP: 25, rewardGems: 5 },
  { id: 'cons-3', category: 'consistency', type: 'accuracy_streak', title: 'Fokus Tajam', description: 'Jawab 3 soal beruntun benar', targetValue: 3, rewardXP: 80, rewardGems: 20 },
];

export async function generateNewDailyGoalsAction(timezoneOffsetMinutes: number = 0) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      columns: { gamificationData: true }
    });

    if (!user) return { success: false, error: "User not found" };

    const gData: any = user.gamificationData || {};
    
    // 1. Midnight Reset Check (Timezone aware)
    const now = new Date();
    const localTime = new Date(now.getTime() - timezoneOffsetMinutes * 60000);
    const todayStr = localTime.toISOString().split('T')[0];
    
    // Jika hari ini sudah digenerate (dan misinya lengkap), tidak perlu diulang
    if (gData.lastDailyReset === todayStr && gData.dailyGoals && gData.dailyGoals.length >= 3) {
      return { success: true, dailyGoals: gData.dailyGoals, lastDailyReset: gData.lastDailyReset, isNew: false };
    }

    // 2. True Random Shuffle menggunakan Fisher-Yates (Server-Side)
    const shuffleArray = (array: any[]) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const academicPool = shuffleArray(SERVER_MASTER_MISSIONS_POOL.filter(m => m.category === 'academic'));
    const competitivePool = shuffleArray(SERVER_MASTER_MISSIONS_POOL.filter(m => m.category === 'competitive'));
    const consistencyPool = shuffleArray(SERVER_MASTER_MISSIONS_POOL.filter(m => m.category === 'consistency'));

    // 3. Clean Slate & Upsert Logic: Ambil 1 dari tiap kategori, progress direset
    // Ini secara efektif MENGHAPUS (menimpa) misi kemarin dari JSONB
    const newMissions = [
      academicPool[0],
      competitivePool[0],
      consistencyPool[0]
    ].map(m => ({
      ...m,
      currentProgress: 0,
      isCompleted: false,
      isClaimed: false
    }));

    // Ganti total array dailyGoals
    gData.dailyGoals = newMissions;
    gData.lastDailyReset = todayStr;
    gData.lastUpdated = Date.now();

    // 4. Update Database
    await db.update(users)
      .set({ gamificationData: gData })
      .where(eq(users.id, session.userId));

    return { 
      success: true, 
      dailyGoals: newMissions, 
      lastDailyReset: todayStr,
      isNew: true
    };

  } catch (err) {
    console.error("Generate Goals Error:", err);
    return { success: false, error: "Internal Error" };
  }
}

export async function claimDailyGoalAction(goalId: string) {
  let retries = 3;
  while (retries > 0) {
    try {
      const session = await getSession();
      if (!session || !session.userId) return { success: false, error: "Unauthorized" };

      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
        columns: { xp: true, profileXp: true, gems: true, level: true, gamificationData: true }
      });
      if (!user) return { success: false, error: "User not found" };

      const gData: any = user.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;
      const goals = gData.dailyGoals || [];
      const goalIndex = goals.findIndex((g: any) => g.id === goalId);

      if (goalIndex === -1) return { success: false, error: "Misi tidak ditemukan" };
      const goal = goals[goalIndex];
      
      if (!goal.isCompleted) return { success: false, error: "Misi belum selesai" };
      if (goal.isClaimed) return { success: false, error: "Misi sudah diklaim" };

      goal.isClaimed = true;
      const earnedXp = goal.rewardXP || 0;
      const earnedGems = goal.rewardGems || 0;

      let newLevel = user.level;
      let newXp = user.profileXp + earnedXp;
      let xpToNextLevel = 100;
      for (let i = 1; i <= newLevel; i++) {
          if (i > 1) xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
      }
      let levelUpGems = 0;
      while (newXp >= xpToNextLevel) {
          newLevel += 1;
          levelUpGems += 50;
          xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
      }
      const totalEarnedGems = earnedGems + levelUpGems;
      const newGems = user.gems + totalEarnedGems;
      const newLeaderboardXp = user.xp + earnedXp;

      gData.monthlyCompletedGoals = (gData.monthlyCompletedGoals || 0) + 1;
      gData.dailyGoals = goals;
      gData.lastUpdated = Date.now();

      const updateCondition = currentLastUpdated > 0
          ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
          : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;

      const result = await db.update(users)
        .set({
            xp: newLeaderboardXp,
            profileXp: newXp,
            gems: newGems,
            level: newLevel,
            gamificationData: gData
        })
        .where(and(eq(users.id, session.userId), updateCondition))
        .returning({ id: users.id });

      if (result.length > 0) {
        return { 
            success: true, 
            earnedXp, 
            earnedGems: totalEarnedGems, 
            newLevel,
            gamificationData: gData,
            newGems,
            newXp,
            newLeaderboardXp
        };
      }
      
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20)); // Jitter backoff
      }
    } catch (err) {
      console.error("Claim Goal Error:", err);
      return { success: false, error: "Internal Error" };
    }
  }
  return { success: false, error: "Transaksi gagal karena konflik data. Silakan coba lagi." };
}

export async function claimMonthlyMilestoneAction(milestone: number, rewardGems: number, tier: string) {
  let retries = 3;
  while (retries > 0) {
    try {
      const session = await getSession();
      if (!session || !session.userId) return { success: false, error: "Unauthorized" };

      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
        columns: { gems: true, gamificationData: true }
      });
      if (!user) return { success: false, error: "User not found" };

      const gData: any = user.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;
      const claimedMonthly = gData.claimedMonthlyMilestones || [];
      const completedGoals = gData.monthlyCompletedGoals || 0;

      if (completedGoals < milestone) return { success: false, error: "Milestone belum tercapai" };
      if (claimedMonthly.includes(milestone)) return { success: false, error: "Milestone sudah diklaim" };

      claimedMonthly.push(milestone);
      const newGems = user.gems + rewardGems;
      
      const newEarnedBadges = gData.earnedBadges || [];
      const badgeId = `monthly-${milestone}-${new Date().toISOString().slice(0,7)}`;
      if (!newEarnedBadges.some((b: any) => b.id === badgeId)) {
        newEarnedBadges.push({
           id: badgeId,
           name: `Pekerja Keras ${tier}`,
           date: new Date().toISOString(),
           tier
        });
      }

      gData.claimedMonthlyMilestones = claimedMonthly;
      gData.earnedBadges = newEarnedBadges;
      gData.lastUpdated = Date.now();

      const updateCondition = currentLastUpdated > 0
          ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
          : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;

      const result = await db.update(users)
        .set({
            gems: newGems,
            gamificationData: gData
        })
        .where(and(eq(users.id, session.userId), updateCondition))
        .returning({ id: users.id });

      if (result.length > 0) {
        return { 
            success: true, 
            earnedGems: rewardGems, 
            gamificationData: gData,
            newGems
        };
      }
      
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20)); // Jitter backoff
      }
    } catch (err) {
      console.error("Claim Milestone Error:", err);
      return { success: false, error: "Internal Error" };
    }
  }
  return { success: false, error: "Transaksi gagal karena konflik data. Silakan coba lagi." };
}

// ==========================================
// UNIVERSAL GOAL EVALUATOR (Server Action)
// ==========================================
export async function updateGoalProgressAction(goalType: string, amount: number = 1, targetUserId?: string, isRealActivity: boolean = true) {
  try {
    if (!isRealActivity) {
      return { success: true, message: "Progress ignored due to compensated/frozen activity" };
    }

    let userId = targetUserId;
    if (!userId) {
      const session = await getSession();
      if (!session || !session.userId) return { success: false, error: "Unauthorized" };
      userId = session.userId;
    }

    let retries = 3;
    while (retries > 0) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { gamificationData: true, gems: true }
      });

      if (!user) return { success: false, error: "User not found" };

      const gData: any = user.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;
      let updated = false;
      let earnedGems = 0;

      if (gData.dailyGoals && Array.isArray(gData.dailyGoals)) {
        gData.dailyGoals.forEach((goal: any) => {
          if (!goal.isCompleted && goal.type === goalType) {
            const oldProgress = goal.currentProgress;
            goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + amount);
            
            if (goal.currentProgress !== oldProgress) {
               updated = true;
               if (goal.currentProgress >= goal.targetValue) {
                 goal.isCompleted = true;
                 earnedGems += goal.reward || 0; // Legacy reward support
               }
            }
          }
        });
      }

      if (!updated) {
        return { success: true, message: "No active goals updated", gamificationData: gData, newGems: user.gems };
      }

      gData.lastUpdated = Date.now();
      const newGems = user.gems + earnedGems;

      const updateCondition = currentLastUpdated > 0
          ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
          : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;

      const result = await db.update(users)
        .set({
            gems: newGems,
            gamificationData: gData
        })
        .where(and(eq(users.id, userId), updateCondition))
        .returning({ id: users.id });

      if (result.length > 0) {
        return { success: true, gamificationData: gData, newGems };
      }
      retries--;
      if (retries > 0) await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
    }
    return { success: false, error: "OCC Conflict" };
  } catch (err) {
    console.error("updateGoalProgressAction Error:", err);
    return { success: false, error: "Internal Error" };
  }
}

