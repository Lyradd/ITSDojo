"use server";

import { db } from "@/db";
import { evaluations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
