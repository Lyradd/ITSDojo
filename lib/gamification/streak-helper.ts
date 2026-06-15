import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { evaluateStreak } from "./streak";

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
        if (streakResult.freezeUsed > 0) history[todayIndex].freezeUsed = true;
      } else {
        history.push({
          date: today,
          count: 1,
          xpEarned: xpToReport,
          freezeUsed: streakResult.freezeUsed > 0,
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
