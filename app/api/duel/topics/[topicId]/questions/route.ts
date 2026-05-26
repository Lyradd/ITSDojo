import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { duelQuestions, duelSubject } from "@/db/schema";
import { MOCK_QUESTIONS, MOCK_WEB_DEV_QUESTIONS } from "@/lib/quiz-mock-data";

type DuelQuestionResponse = {
  id: string;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "short_answer" | "slider" | "puzzle";
  options?: string[];
  correctAnswer: string | number;
  sliderMin?: number;
  sliderMax?: number;
  answerMargin?: number;
  bloomLevel: string;
  bloomCategory: string;
  bloomWeight: number;
  timeLimit: number;
  order: number;
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
    bloomLevel: question.bloomLevel,
    bloomCategory: question.bloomCategory,
    bloomWeight: question.bloomWeight,
    timeLimit: question.timeLimit,
    order: question.order ?? index + 1,
  };
}

function mapMockQuestion(question: typeof MOCK_QUESTIONS[number] | typeof MOCK_WEB_DEV_QUESTIONS[number]): DuelQuestionResponse {
  return {
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options,
    correctAnswer: question.correctAnswer,
    sliderMin: question.sliderMin,
    sliderMax: question.sliderMax,
    answerMargin: question.answerMargin,
    bloomLevel: question.bloomLevel,
    bloomCategory: question.bloomCategory,
    bloomWeight: question.bloomWeight,
    timeLimit: question.timeLimit,
    order: question.order,
  };
}

function getFallbackQuestions(topicName: string) {
  const normalizedTopic = topicName.toLowerCase();

  if (normalizedTopic.includes("web") || normalizedTopic.includes("html") || normalizedTopic.includes("css") || normalizedTopic.includes("javascript")) {
    return MOCK_WEB_DEV_QUESTIONS.map(mapMockQuestion);
  }

  if (normalizedTopic.includes("python") || normalizedTopic.includes("algoritma") || normalizedTopic.includes("program")) {
    return MOCK_QUESTIONS.map(mapMockQuestion);
  }

  return [...MOCK_QUESTIONS, ...MOCK_WEB_DEV_QUESTIONS]
    .map(mapMockQuestion)
    .sort((left, right) => left.order - right.order);
}

export async function GET(
  req: Request,
  { params }: { params: { topicId: string } }
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

  const questions = rows.length > 0
    ? rows.map((question, index) => mapDbQuestion(question, index))
    : getFallbackQuestions(topic.subjectName);

  return NextResponse.json(
    {
      topic,
      questions,
      source: rows.length > 0 ? "database" : "fallback",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    }
  );
}