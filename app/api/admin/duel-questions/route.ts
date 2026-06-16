import { NextResponse } from "next/server";
import { db } from "@/db";
import { duelQuestions, duelSubject } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdminOrDosen } from "@/lib/auth-guard";

import { z } from "zod";

const questionSchema = z.object({
  topicId: z.coerce.number().min(1, "Topic is required"),
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["multiple_choice", "true_false", "short_answer", "slider"]),
  options: z.array(z.string()).nullable().optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  sliderMin: z.coerce.number().nullable().optional().catch(null),
  sliderMax: z.coerce.number().nullable().optional().catch(null),
  answerMargin: z.coerce.number().nullable().optional().catch(null),
  timeLimit: z.coerce.number().default(30),
  order: z.coerce.number().optional()
});

export async function GET(req: Request) {
  const authError = await requireAdminOrDosen(req);
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
  const authError = await requireAdminOrDosen(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = questionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }

    const {
      topicId,
      questionText,
      questionType,
      correctAnswer,
      sliderMin,
      sliderMax,
      answerMargin,
      timeLimit,
    } = parsed.data;

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

    const nextOrder = parsed.data.order ?? (maxOrderRow[0]?.order ?? 0) + 1;
    
    const hasOptions = questionType === "multiple_choice" || questionType === "true_false";
    const options = hasOptions && Array.isArray(parsed.data.options)
      ? parsed.data.options.map((option) => `${option}`.trim()).filter(Boolean)
      : []; // Use empty array instead of null for Drizzle array column compatibility

    console.log("Attempting to insert:", { topicId, questionText, questionType, options });
    const [createdQuestion] = await db
      .insert(duelQuestions)
      .values({
        topicId,
        questionText,
        questionType,
        options,
        correctAnswer,
        sliderMin,
        sliderMax,
        answerMargin,
        timeLimit,
        order: nextOrder,
      })
      .returning();

    return NextResponse.json(createdQuestion, { status: 201 });
  } catch (error: any) {
    console.error("Drizzle Insert Error:", error);
    const message = error?.message || "Failed to create duel question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}