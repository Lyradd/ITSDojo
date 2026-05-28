"use server";

import { db } from "@/db";
import { users, evaluationResults } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

// Fetch semua mahasiswa dengan stats real-time dari DB.
// Dipakai di /dosen/students dan /admin/students.
export async function getAllStudents() {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        semester: users.semester,
        level: users.level,
        xp: users.xp,
        profileXp: users.profileXp,
        gems: users.gems,
        accuracy: users.accuracy,
        streak: users.streak,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'mahasiswa'));

    if (allUsers.length === 0) return [];

    // Hitung jumlah evaluasi yang sudah diselesaikan per user
    const evalCounts = await db
      .select({
        studentId: evaluationResults.studentId,
        completed: count(evaluationResults.id).as('completed'),
        lastCompletedAt: sql<Date>`MAX(${evaluationResults.completedAt})`.as('last_completed_at'),
      })
      .from(evaluationResults)
      .groupBy(evaluationResults.studentId);
    const evalMap = new Map(evalCounts.map((e) => [e.studentId, e]));

    return allUsers.map((u) => {
      const stats = evalMap.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar ?? 'bg-blue-200 text-blue-700',
        semester: u.semester,
        level: u.level,
        xp: u.xp,
        profileXp: u.profileXp,
        gems: u.gems,
        accuracy: u.accuracy ?? 0,
        streak: u.streak,
        evaluationsCompleted: Number(stats?.completed ?? 0),
        lastActiveAt: stats?.lastCompletedAt ?? u.createdAt,
      };
    });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return [];
  }
}
