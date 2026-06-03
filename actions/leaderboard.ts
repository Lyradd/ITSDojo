"use server";

import { db } from "@/db";
import { users, enrollments, evaluationResults } from "@/db/schema";
import { desc, eq, sql, and, inArray, countDistinct } from "drizzle-orm";
import { getAngkatanFromSemester } from "@/lib/academic-utils";
import { LeaderboardEntry } from "@/lib/evaluation-store";

export async function getLeaderboardData(filter?: {
  courseId?: string; // filter ke mahasiswa yang enrolled+accepted di course ini
}): Promise<LeaderboardEntry[]> {
  try {
    let dbUsers: Array<{
      id: string;
      name: string;
      avatar: string | null;
      xp: number;
      level: number;
      accuracy: number | null;
      semester: number;
    }>;

    if (filter?.courseId) {
      // Filter: hanya mahasiswa yang punya enrollment 'accepted' di course ini.
      dbUsers = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          xp: users.xp,
          level: users.level,
          accuracy: users.accuracy,
          semester: users.semester,
        })
        .from(users)
        .innerJoin(enrollments, eq(enrollments.studentId, users.id))
        .where(
          and(
            eq(users.role, 'mahasiswa'),
            eq(enrollments.courseId, filter.courseId),
            eq(enrollments.status, 'accepted'),
          ),
        )
        .orderBy(desc(users.xp))
        .limit(100);
    } else {
      dbUsers = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          xp: users.xp,
          level: users.level,
          accuracy: users.accuracy,
          semester: users.semester,
        })
        .from(users)
        .where(eq(users.role, 'mahasiswa'))
        .orderBy(desc(users.xp))
        .limit(100);
    }

    if (dbUsers.length === 0) return [];

    // Hitung stats sekunder per user dari evaluationResults: totalEvaluasi, avgAccuracy.
    const userIds = dbUsers.map((u) => u.id);
    const stats = await db
      .select({
        studentId: evaluationResults.studentId,
        totalEvals: sql<number>`COUNT(*)::int`,
        avgAccuracy: sql<number>`COALESCE(ROUND(AVG(${evaluationResults.accuracy})), 0)::int`,
      })
      .from(evaluationResults)
      .where(inArray(evaluationResults.studentId, userIds))
      .groupBy(evaluationResults.studentId);
    const statsMap = new Map(stats.map((s) => [s.studentId, s]));

    // Hitung courses taken per user (enrolled accepted)
    const coursesPerUser = await db
      .select({
        studentId: enrollments.studentId,
        coursesTaken: countDistinct(enrollments.courseId).as('courses_taken'),
      })
      .from(enrollments)
      .where(
        and(
          inArray(enrollments.studentId, userIds),
          eq(enrollments.status, 'accepted'),
        ),
      )
      .groupBy(enrollments.studentId);
    const coursesMap = new Map(coursesPerUser.map((c) => [c.studentId, Number(c.coursesTaken)]));

    return dbUsers.map((user, index) => {
      const angkatan = getAngkatanFromSemester(user.semester);
      const userStats = statsMap.get(user.id);

      return {
        userId: user.id,
        name: user.name,
        avatar: user.avatar || 'bg-blue-200 text-blue-700',
        score: user.xp,
        totalQuestions: userStats?.totalEvals ?? 0,
        answeredQuestions: userStats?.totalEvals ?? 0,
        accuracy: userStats?.avgAccuracy ?? user.accuracy ?? 0,
        rank: index + 1,
        lastUpdate: Date.now(),
        isCurrentUser: false,
        batch: angkatan.toString(),
        coursesTaken: coursesMap.get(user.id) ?? 0,
      };
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return [];
  }
}

export async function getUserGlobalRank(userId: string, semester?: number) {
  try {
    const filters = [eq(users.role, 'mahasiswa')];
    if (semester !== undefined) {
      filters.push(eq(users.semester, semester));
    }

    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(...filters))
      .orderBy(desc(users.xp));

    const totalUsers = allUsers.length;
    const rank = allUsers.findIndex(u => u.id === userId) + 1;

    return { rank: rank > 0 ? rank : null, totalUsers };
  } catch (error) {
    console.error("Failed to get user global rank:", error);
    return { rank: null, totalUsers: 0 };
  }
}
