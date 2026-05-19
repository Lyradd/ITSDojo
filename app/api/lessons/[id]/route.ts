import { NextResponse } from "next/server";
import { db } from "@/db";
import { lessons, testCases } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/lessons/[id] — Ambil detail lesson + test cases
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    // Ambil lesson
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId));

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Ambil test cases untuk lesson ini
    const cases = await db
      .select()
      .from(testCases)
      .where(eq(testCases.lessonId, lessonId))
      .orderBy(asc(testCases.order));

    return NextResponse.json({
      ...lesson,
      testCases: cases,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
