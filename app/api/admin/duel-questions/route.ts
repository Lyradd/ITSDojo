import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelQuestions, duelSubject } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

type DuelQuestionType = "multiple_choice" | "true_false" | "short_answer" | "slider";

type CreateDuelQuestionBody = {
  topicId?: number | string;
  questionText?: string;
  questionType?: DuelQuestionType;
  options?: string[];
  correctAnswer?: string | number;
  sliderMin?: number | string | null;
  sliderMax?: number | string | null;
  answerMargin?: number | string | null;
  bloomLevel?: string;
  bloomCategory?: string;
  bloomWeight?: number | string;
  timeLimit?: number | string;
  order?: number | string;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export async function GET(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const rows = await db
      .select({
        id: duelQuestions.id,
        topicId: duelQuestions.topicId,
        questionText: duelQuestions.questionText,
        questionType: duelQuestions.questionType,
        options: duelQuestions.options,
        correctAnswer: duelQuestions.correctAnswer,
        sliderMin: duelQuestions.sliderMin,
        sliderMax: duelQuestions.sliderMax,
        answerMargin: duelQuestions.answerMargin,
        bloomLevel: duelQuestions.bloomLevel,
        bloomCategory: duelQuestions.bloomCategory,
        bloomWeight: duelQuestions.bloomWeight,
        timeLimit: duelQuestions.timeLimit,
        order: duelQuestions.order,
        topicName: duelSubject.subjectName,
      })
      .from(duelQuestions)
      .leftJoin(duelSubject, eq(duelQuestions.topicId, duelSubject.id))
      .orderBy(desc(duelQuestions.id));

    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load duel questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = (await req.json()) as CreateDuelQuestionBody;
    const topicId = toNumber(body.topicId);
    const questionText = typeof body.questionText === "string" ? body.questionText.trim() : "";
    const questionType = body.questionType;
    const bloomLevel = typeof body.bloomLevel === "string" ? body.bloomLevel.trim() : "";
    const bloomCategory = typeof body.bloomCategory === "string" ? body.bloomCategory.trim() : "";
    const correctAnswer = body.correctAnswer;

    if (!topicId) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!questionText || !questionType || !bloomLevel || !bloomCategory || correctAnswer === undefined || correctAnswer === null || `${correctAnswer}`.trim() === "") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [topic] = await db
      .select({ id: duelSubject.id })
      .from(duelSubject)
      .where(eq(duelSubject.id, topicId))
      .limit(1);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const maxOrderRow = await db
      .select({ order: duelQuestions.order })
      .from(duelQuestions)
      .where(eq(duelQuestions.topicId, topicId))
      .orderBy(desc(duelQuestions.order))
      .limit(1);

    const nextOrder = toNumber(body.order) ?? (maxOrderRow[0]?.order ?? 0) + 1;
    const hasOptions = questionType === "multiple_choice" || questionType === "true_false";
    const options = hasOptions && Array.isArray(body.options)
      ? body.options.map((option) => `${option}`.trim()).filter(Boolean)
      : null;

    const [createdQuestion] = await db
      .insert(duelQuestions)
      .values({
        topicId,
        questionText,
        questionType,
        options,
        correctAnswer: `${correctAnswer}`,
        sliderMin: toNumber(body.sliderMin),
        sliderMax: toNumber(body.sliderMax),
        answerMargin: toNumber(body.answerMargin),
        bloomLevel,
        bloomCategory,
        bloomWeight: toNumber(body.bloomWeight) ?? 10,
        timeLimit: toNumber(body.timeLimit) ?? 30,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(createdQuestion, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create duel question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}