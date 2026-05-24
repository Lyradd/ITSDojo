"use server";

import { db } from "@/db";
import { evaluations, evaluationResults, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

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

export async function getEvaluationById(id: string) {
  try {
    const result = await db.select().from(evaluations).where(eq(evaluations.id, id));
    return result[0] || null;
  } catch (error) {
    console.error(`Failed to fetch evaluation ${id}:`, error);
    return null;
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

    await db.insert(evaluationResults).values({
      evaluationId: data.evaluationId,
      studentId: userMatch[0].id,
      score: data.score,
      accuracy: data.accuracy,
      timeSpent: data.timeSpent,
      completedAt: new Date(),
    });
    return { success: true, persistedToResults: true };
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
