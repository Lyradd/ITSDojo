"use server";

import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function buyShopItemAction(type: string, cost: number) {
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

    await db.update(users)
      .set({ 
        gems: user.gems - cost,
        gamificationData: gData 
      })
      .where(eq(users.id, session.userId));

    return { 
      success: true, 
      newGems: user.gems - cost, 
      gamificationData: gData 
    };
  } catch (err) {
    console.error("Shop Error:", err);
    return { success: false, error: "Internal Error" };
  }
}

export async function completeLessonAction(lessonIdStr: string, isPerfect: boolean, baseRewardXp: number, baseRewardGems: number) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const lessonId = parseInt(lessonIdStr);
    if (isNaN(lessonId)) return { success: false, error: "Invalid lesson ID" };

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      columns: { xp: true, profileXp: true, gems: true, level: true, streak: true, gamificationData: true }
    });

    if (!user) return { success: false, error: "User not found" };

    // Validasi apakah lesson ini sudah pernah dikerjakan?
    const existingProgress = await db.query.userProgress.findFirst({
      where: and(eq(userProgress.userId, session.userId), eq(userProgress.lessonId, lessonId))
    });

    const isNew = !existingProgress;
    const gData: any = user.gamificationData || {};
    const hasMiner = gData.hasGemMiner || false;
    const mult = gData.xpMultiplier || 1;
    const multTime = gData.multiplierEndTime || null;
    const isMultActive = multTime && multTime > Date.now();

    let earnedXp = isNew ? (baseRewardXp || 50) : 10;
    if (isMultActive) earnedXp *= mult;

    let earnedGems = isNew ? (baseRewardGems || 10) : 0;
    if (hasMiner) earnedGems *= 2;

    // UPDATE DAILY GOALS
    if (gData.dailyGoals && Array.isArray(gData.dailyGoals)) {
      gData.dailyGoals.forEach((goal: any) => {
        if (!goal.isCompleted) {
          if (goal.type === 'xp') {
            goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + earnedXp);
          } else if (goal.type === 'lesson') {
            goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + 1);
          } else if (goal.type === 'perfect' && isPerfect) {
            goal.currentProgress = Math.min(goal.targetValue, goal.currentProgress + 1);
          }

          if (goal.currentProgress >= goal.targetValue) {
            goal.isCompleted = true;
            earnedGems += goal.reward || 0; // Tambahkan reward gems jika misi selesai
          }
        }
      });
    }

    // UPDATE HISTORY DATE (STREAK NORMALIZATION TO MIDNIGHT)
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    let history = gData.activityHistory || [];
    const todayIndex = history.findIndex((h: any) => h.date === today);
    if (todayIndex !== -1) {
      history[todayIndex].count += 1;
      history[todayIndex].xpEarned = (history[todayIndex].xpEarned || 0) + earnedXp;
    } else {
      history.push({ date: today, count: 1, xpEarned: earnedXp });
    }
    
    // Evaluate Streak
    let newStreak = user.streak;
    let newLastActiveDate = gData.lastActiveDate;

    const normalizeToMidnight = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const isCorruptedState = newLastActiveDate === today && newStreak === 0;

    if (!newLastActiveDate || newLastActiveDate !== today || isCorruptedState) {
      if (newLastActiveDate && newLastActiveDate !== '') {
        const todayMidnight = normalizeToMidnight(today);
        const lastActiveMidnight = normalizeToMidnight(newLastActiveDate);
        const diffMs = todayMidnight.getTime() - lastActiveMidnight.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1 || isCorruptedState) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      newLastActiveDate = today;
    }

    // Evaluate Level Up
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

    // Achievements & Counters
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

    // Note: neon-http driver tidak mendukung db.transaction() secara native
    if (isNew) {
      await db.insert(userProgress).values({ userId: session.userId, lessonId });
    }

    await db.update(users)
      .set({
          xp: newLeaderboardXp,
          profileXp: newXp,
          gems: newGems,
          level: newLevel,
          streak: newStreak,
          gamificationData: gData
      })
      .where(eq(users.id, session.userId));

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
  } catch (err) {
    console.error("Complete Lesson Error:", err);
    return { success: false, error: "Internal Error" };
  }
}

export async function resetLearningProgressAction() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    // Hapus seluruh progress lesson pengguna ini
    await db.delete(userProgress).where(eq(userProgress.userId, session.userId));

    // Reset status profil ke default
    await db.update(users)
      .set({
        xp: 0,
        profileXp: 0,
        gems: 0,
        level: 1,
        streak: 0,
        gamificationData: {} // Kosongkan seluruh data statis dan array
      })
      .where(eq(users.id, session.userId));

    // Revalidasi cache Next.js agar tidak menampilkan data usang
    revalidatePath('/learn');
    revalidatePath('/goals');
    revalidatePath('/profile');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error("Reset Progress Error:", err);
    return { success: false, error: "Internal Error" };
  }
}
