"use server";

import { db } from "@/db";
import { evaluations, evaluationResults, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function createEvaluation(data: any) {
  try {
    const newEval = {
      id: `eval-${Date.now()}`,
      courseId: data.courseId || 'fe-basic', // Fallback to 'fe-basic' course if not specified
      title: data.title,
      description: data.description,
      duration: data.duration,
      isActive: true,
      totalPoints: data.totalPoints,
      questions: data.questions, // Stored directly as JSONB array
      sessionStatus: 'waiting',
    };

    await db.insert(evaluations).values(newEval);
    return { success: true, evaluationId: newEval.id };
  } catch (error) {
    console.error("Failed to create evaluation:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getActiveEvaluations() {
  try {
    // Fetch all active evaluations, sorted by newest first
    return await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.isActive, true))
      .orderBy(desc(evaluations.createdAt));
  } catch (error) {
    console.error("Failed to fetch active evaluations:", error);
    return [];
  }
}

export async function getAllEvaluations() {
  try {
    return await db
      .select()
      .from(evaluations)
      .orderBy(desc(evaluations.createdAt));
  } catch (error) {
    console.error("Failed to fetch all evaluations:", error);
    return [];
  }
}

export async function getEvaluationById(id: string) {
  try {
    const result = await db.select().from(evaluations).where(eq(evaluations.id, id));
    return result[0] || null;
  } catch (error) {
    console.error(`Failed to fetch evaluation ${id}:`, error);
    return null;
  }
}

export async function updateEvaluation(id: string, data: {
  title: string;
  description: string;
  duration: number;
  totalPoints: number;
  questions: any[];
  courseId?: string;
}) {
  try {
    const updateData: Record<string, any> = {
      title: data.title,
      description: data.description,
      duration: data.duration,
      totalPoints: data.totalPoints,
      questions: data.questions,
    };
    if (data.courseId) updateData.courseId = data.courseId;

    await db.update(evaluations).set(updateData).where(eq(evaluations.id, id));
    return { success: true };
  } catch (error) {
    console.error(`Failed to update evaluation ${id}:`, error);
    return { success: false, error: "Database error" };
  }
}

// ============================================
// SESSION LIFECYCLE (dosen → mahasiswa sync)
// ============================================

export async function startEvaluationSession(evaluationId: string) {
  try {
    await db
      .update(evaluations)
      .set({ sessionStatus: 'active', sessionStartedAt: new Date() })
      .where(eq(evaluations.id, evaluationId));
    return { success: true, startedAt: Date.now() };
  } catch (error) {
    console.error(`Failed to start session ${evaluationId}:`, error);
    return { success: false, error: "Database error" };
  }
}

export async function finishEvaluationSession(evaluationId: string) {
  try {
    await db
      .update(evaluations)
      .set({ sessionStatus: 'finished', isActive: false })
      .where(eq(evaluations.id, evaluationId));
    return { success: true };
  } catch (error) {
    console.error(`Failed to finish session ${evaluationId}:`, error);
    return { success: false, error: "Database error" };
  }
}

export async function reopenEvaluationSession(evaluationId: string) {
  try {
    await db
      .update(evaluations)
      .set({ sessionStatus: 'waiting', isActive: true, sessionStartedAt: null })
      .where(eq(evaluations.id, evaluationId));
    return { success: true };
  } catch (error) {
    console.error(`Failed to reopen session ${evaluationId}:`, error);
    return { success: false, error: "Database error" };
  }
}

export async function deleteEvaluation(evaluationId: string) {
  try {
    await db.delete(evaluations).where(eq(evaluations.id, evaluationId));
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete evaluation ${evaluationId}:`, error);
    return { success: false, error: "Database error" };
  }
}

export async function duplicateEvaluation(evaluationId: string) {
  try {
    const original = await db.select().from(evaluations).where(eq(evaluations.id, evaluationId));
    if (original.length === 0) {
      return { success: false, error: "Evaluation not found" };
    }
    const e = original[0];
    const newId = `eval-${Date.now()}`;
    await db.insert(evaluations).values({
      id: newId,
      courseId: e.courseId,
      title: `${e.title} (Copy)`,
      description: e.description,
      duration: e.duration,
      isActive: false,
      totalPoints: e.totalPoints,
      questions: e.questions as any,
      sessionStatus: 'waiting',
    });
    return { success: true, evaluationId: newId };
  } catch (error) {
    console.error(`Failed to duplicate evaluation ${evaluationId}:`, error);
    return { success: false, error: "Database error" };
  }
}

export async function getEvaluationSessionStatus(evaluationId: string) {
  try {
    const result = await db
      .select({
        sessionStatus: evaluations.sessionStatus,
        sessionStartedAt: evaluations.sessionStartedAt,
        isActive: evaluations.isActive,
      })
      .from(evaluations)
      .where(eq(evaluations.id, evaluationId));
    return result[0] || null;
  } catch (error) {
    console.error(`Failed to fetch session status ${evaluationId}:`, error);
    return null;
  }
}

export async function upsertEvaluationProgress(data: {
  evaluationId: string;
  studentName: string;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  status: string;
  timeElapsed: number;
}) {
  try {
    const { evaluationProgress } = await import("@/db/schema");
    await db.insert(evaluationProgress).values({
      evaluationId: data.evaluationId,
      studentName: data.studentName,
      currentQuestion: data.currentQuestion,
      totalQuestions: data.totalQuestions,
      score: data.score,
      status: data.status,
      timeElapsed: data.timeElapsed,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [evaluationProgress.evaluationId, evaluationProgress.studentName],
      set: {
        currentQuestion: data.currentQuestion,
        totalQuestions: data.totalQuestions,
        score: data.score,
        status: data.status,
        timeElapsed: data.timeElapsed,
        updatedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert progress:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getLiveEvaluationProgress(evaluationId: string) {
  try {
    const { evaluationProgress } = await import("@/db/schema");
    const results = await db
      .select()
      .from(evaluationProgress)
      .where(eq(evaluationProgress.evaluationId, evaluationId));
    return results;
  } catch (error) {
    console.error(`Failed to fetch progress for ${evaluationId}:`, error);
    return [];
  }
}

// ============================================
// EVALUATION RESULTS (final submission)
// ============================================

export async function submitEvaluationResult(data: {
  evaluationId: string;
  studentName: string;
  score: number;
  accuracy: number;
  timeSpent: number; // dalam detik
}) {
  try {
    // Cari user berdasarkan name (best effort — kalau tidak ketemu, skip insert ke evaluationResults)
    const userMatch = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.name, data.studentName))
      .limit(1);

    if (userMatch.length === 0) {
      console.warn(`submitEvaluationResult: user "${data.studentName}" tidak ditemukan, hasil hanya tersimpan di evaluation_progress`);
      return { success: true, persistedToResults: false };
    }

    const userId = userMatch[0].id;

    // Cek apakah user sudah pernah submit hasil untuk evaluasi ini.
    // Kalau sudah, jangan tambah XP lagi (anti double-claim) tapi tetap insert hasil baru.
    const previous = await db
      .select({ id: evaluationResults.id })
      .from(evaluationResults)
      .where(
        and(
          eq(evaluationResults.evaluationId, data.evaluationId),
          eq(evaluationResults.studentId, userId),
        ),
      )
      .limit(1);
    const isFirstSubmission = previous.length === 0;

    await db.insert(evaluationResults).values({
      evaluationId: data.evaluationId,
      studentId: userId,
      score: data.score,
      accuracy: data.accuracy,
      timeSpent: data.timeSpent,
      completedAt: new Date(),
    });

    // Tambahkan XP ke profil user agar papan peringkat global ter-update.
    // Hanya pada submission pertama untuk evaluasi ini.
    if (isFirstSubmission && data.score > 0) {
      await db
        .update(users)
        .set({ xp: sql`${users.xp} + ${data.score}` })
        .where(eq(users.id, userId));

      // Broadcast leaderboard fresh ke semua client yang subscribe via Socket.IO.
      // globalThis.__io di-set oleh server.js saat startup. Aman kalau tidak ada (mis. di test env).
      try {
        const io = (globalThis as any).__io;
        if (io) {
          const { getLeaderboardData } = await import("./leaderboard");
          const fresh = await getLeaderboardData();
          io.emit("leaderboard:update", fresh);
        }
      } catch (err) {
        console.warn("Leaderboard broadcast failed (non-fatal):", err);
      }
    }

    return { success: true, persistedToResults: true, xpAdded: isFirstSubmission ? data.score : 0 };
  } catch (error) {
    console.error("Failed to submit evaluation result:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getStudentEvaluationResult(evaluationId: string, studentName: string) {
  try {
    const userMatch = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.name, studentName))
      .limit(1);

    if (userMatch.length === 0) return null;

    const result = await db
      .select()
      .from(evaluationResults)
      .where(
        and(
          eq(evaluationResults.evaluationId, evaluationId),
          eq(evaluationResults.studentId, userMatch[0].id),
        ),
      )
      .orderBy(desc(evaluationResults.completedAt))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error(`Failed to fetch student result:`, error);
    return null;
  }
}

// Ambil semua hasil submission untuk evaluasi tertentu (untuk halaman results dosen).
export async function getAllResultsForEvaluation(evaluationId: string) {
  try {
    const rows = await db
      .select({
        id: evaluationResults.id,
        evaluationId: evaluationResults.evaluationId,
        studentId: evaluationResults.studentId,
        score: evaluationResults.score,
        accuracy: evaluationResults.accuracy,
        timeSpent: evaluationResults.timeSpent,
        completedAt: evaluationResults.completedAt,
        studentName: users.name,
        studentAvatar: users.avatar,
      })
      .from(evaluationResults)
      .innerJoin(users, eq(users.id, evaluationResults.studentId))
      .where(eq(evaluationResults.evaluationId, evaluationId))
      .orderBy(desc(evaluationResults.score));
    return rows;
  } catch (error) {
    console.error(`Failed to fetch all results for ${evaluationId}:`, error);
    return [];
  }
}

// ============================================
// AGGREGATE STATS untuk halaman dosen
// ============================================

export async function getEvaluationStats() {
  try {
    const { evaluationProgress } = await import("@/db/schema");

    // Aggregate global: total peserta unik & rata-rata akurasi (dari evaluation_results)
    const aggregate = await db
      .select({
        totalParticipants: sql<number>`COUNT(DISTINCT ${evaluationResults.studentId})::int`,
        avgAccuracy: sql<number>`COALESCE(ROUND(AVG(${evaluationResults.accuracy})), 0)::int`,
      })
      .from(evaluationResults);

    // Per-evaluasi peserta count (dari evaluation_progress — termasuk yang masih aktif)
    const perEvaluation = await db
      .select({
        evaluationId: evaluationProgress.evaluationId,
        participantCount: sql<number>`COUNT(DISTINCT ${evaluationProgress.studentName})::int`,
      })
      .from(evaluationProgress)
      .groupBy(evaluationProgress.evaluationId);

    const perEvaluationMap: Record<string, number> = {};
    perEvaluation.forEach((row) => {
      perEvaluationMap[row.evaluationId] = row.participantCount;
    });

    return {
      totalParticipants: aggregate[0]?.totalParticipants ?? 0,
      avgAccuracy: aggregate[0]?.avgAccuracy ?? 0,
      perEvaluationParticipants: perEvaluationMap,
    };
  } catch (error) {
    console.error("Failed to fetch evaluation stats:", error);
    return {
      totalParticipants: 0,
      avgAccuracy: 0,
      perEvaluationParticipants: {},
    };
  }
}
