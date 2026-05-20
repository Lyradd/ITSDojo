"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getAngkatanFromSemester } from "@/lib/academic-utils";
import { LeaderboardEntry } from "@/lib/evaluation-store";

export async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    // Fetch top 100 mahasiswa based on XP
    const dbUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'mahasiswa'))
      .orderBy(desc(users.xp))
      .limit(100);

    // Map to LeaderboardEntry format needed by the frontend
    return dbUsers.map((user, index) => {
      // Calculate Angkatan dynamically based on their semester in DB
      const angkatan = getAngkatanFromSemester(user.semester);
      
      return {
        userId: user.id,
        name: user.name,
        avatar: user.avatar || 'bg-blue-200 text-blue-700',
        score: user.xp,
        // Fallback mock data for stats we haven't fully joined yet
        totalQuestions: 50, 
        answeredQuestions: user.level * 10,
        accuracy: user.accuracy || 0,
        rank: index + 1,
        lastUpdate: Date.now(),
        isCurrentUser: false, // will be overridden in the frontend check
        batch: angkatan.toString(),
        coursesTaken: Math.floor(user.level / 2) || 1, // mock based on level
      };
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return [];
  }
}
