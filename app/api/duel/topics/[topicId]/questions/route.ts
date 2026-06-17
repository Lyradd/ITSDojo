import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { duelQuestions, duelSubject } from "@/db/schema";

type DuelQuestionResponse = {
  id: string;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "short_answer" | "slider" | "puzzle";
  options?: string[];
  correctAnswer: string | number;
  sliderMin?: number;
  sliderMax?: number;
  answerMargin?: number;

  timeLimit: number;
  order: number;
  points: number;
};

function mapDbQuestion(question: typeof duelQuestions.$inferSelect, index: number): DuelQuestionResponse {
  return {
    id: String(question.id),
    questionText: question.questionText,
    questionType: question.questionType as DuelQuestionResponse["questionType"],
    options: question.options ?? undefined,
    correctAnswer: question.questionType === "slider" ? Number(question.correctAnswer) : question.correctAnswer,
    sliderMin: question.sliderMin ?? undefined,
    sliderMax: question.sliderMax ?? undefined,
    answerMargin: question.answerMargin ?? undefined,

    timeLimit: question.timeLimit,
    order: question.order ?? index + 1,
    points: question.bloomWeight,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const topicId = Number(resolvedParams.topicId);

  if (!Number.isFinite(topicId)) {
    return NextResponse.json({ error: "Invalid topicId" }, { status: 400 });
  }

  const [topic] = await db
    .select({ id: duelSubject.id, subjectName: duelSubject.subjectName, description: duelSubject.description })
    .from(duelSubject)
    .where(eq(duelSubject.id, topicId))
    .limit(1);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(duelQuestions)
    .where(eq(duelQuestions.topicId, topicId))
    .orderBy(duelQuestions.order);

  const questions = rows.map((question, index) => mapDbQuestion(question, index));

  return NextResponse.json(
    {
      topic,
      questions,
      source: "database",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    }
  );
}