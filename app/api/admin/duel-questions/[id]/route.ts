import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelQuestions, duelSubject } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminOrDosen } from "@/lib/auth-guard";

type DuelQuestionType = "multiple_choice" | "true_false" | "short_answer" | "slider";

type UpdateDuelQuestionBody = {
  topicId?: number | string;
  questionText?: string;
  questionType?: DuelQuestionType;
  options?: string[];
  correctAnswer?: string | number;
  sliderMin?: number | string | null;
  sliderMax?: number | string | null;
  answerMargin?: number | string | null;
  points?: number | string;
  timeLimit?: number | string;
  order?: number | string;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrDosen(req);
  if (authError) return authError;

  try {
    const resolvedParams = await Promise.resolve(params);
    const questionId = Number(resolvedParams.id);

    if (!Number.isFinite(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const body = (await req.json()) as UpdateDuelQuestionBody;

    // Verify question exists
    const [existingQuestion] = await db
      .select()
      .from(duelQuestions)
      .where(eq(duelQuestions.id, questionId))
      .limit(1);

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Prepare update payload
    const updatePayload: Record<string, any> = {};

    if (body.topicId !== undefined) {
      const topicId = toNumber(body.topicId);
      if (!topicId) {
        return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
      }
      // Verify topic exists
      const [topic] = await db
        .select({ id: duelSubject.id })
        .from(duelSubject)
        .where(eq(duelSubject.id, topicId))
        .limit(1);

      if (!topic) {
        return NextResponse.json({ error: "Topic not found" }, { status: 404 });
      }
      updatePayload.topicId = topicId;
    }

    if (body.questionText !== undefined) {
      const text = typeof body.questionText === "string" ? body.questionText.trim() : "";
      if (!text) {
        return NextResponse.json({ error: "Question text is required" }, { status: 400 });
      }
      updatePayload.questionText = text;
    }

    if (body.questionType !== undefined) {
      updatePayload.questionType = body.questionType;
    }

    if (body.correctAnswer !== undefined) {
      if (body.correctAnswer === null || `${body.correctAnswer}`.trim() === "") {
        return NextResponse.json({ error: "Correct answer is required" }, { status: 400 });
      }
      updatePayload.correctAnswer = `${body.correctAnswer}`;
    }

    if (body.options !== undefined) {
      const questionType = body.questionType ?? existingQuestion.questionType;
      const hasOptions = questionType === "multiple_choice" || questionType === "true_false";
      updatePayload.options = hasOptions && Array.isArray(body.options)
        ? body.options.map((option) => `${option}`.trim()).filter(Boolean)
        : null;
    }

    if (body.sliderMin !== undefined) updatePayload.sliderMin = toNumber(body.sliderMin);
    if (body.sliderMax !== undefined) updatePayload.sliderMax = toNumber(body.sliderMax);
    if (body.answerMargin !== undefined) updatePayload.answerMargin = toNumber(body.answerMargin);
    if (body.points !== undefined) updatePayload.bloomWeight = toNumber(body.points) ?? 10;
    if (body.timeLimit !== undefined) updatePayload.timeLimit = toNumber(body.timeLimit) ?? 30;
    if (body.order !== undefined) updatePayload.order = toNumber(body.order) ?? existingQuestion.order;

    const [updatedQuestion] = await db
      .update(duelQuestions)
      .set(updatePayload)
      .where(eq(duelQuestions.id, questionId))
      .returning();

    // Fetch the topic name as well so the frontend receives the full DuelQuestionRow structure
    const [topicData] = await db
      .select({ subjectName: duelSubject.subjectName })
      .from(duelSubject)
      .where(eq(duelSubject.id, updatedQuestion.topicId))
      .limit(1);

    const result = {
      ...updatedQuestion,
      topicName: topicData?.subjectName ?? null,
      points: updatedQuestion.bloomWeight,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update duel question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminOrDosen(req);
  if (authError) return authError;

  try {
    const resolvedParams = await Promise.resolve(params);
    const questionId = Number(resolvedParams.id);

    if (!Number.isFinite(questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const [deletedQuestion] = await db
      .delete(duelQuestions)
      .where(eq(duelQuestions.id, questionId))
      .returning();

    if (!deletedQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete duel question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
