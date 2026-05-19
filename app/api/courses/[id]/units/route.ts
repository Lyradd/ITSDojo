import { NextResponse } from "next/server";
import { db } from "@/db";
import { units, lessons, testCases } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/courses/[id]/units — Ambil semua unit + lessons untuk sebuah kursus
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Ambil semua unit milik kursus ini, diurutkan
    const courseUnits = await db
      .select()
      .from(units)
      .where(eq(units.courseId, courseId))
      .orderBy(asc(units.order));

    // Untuk setiap unit, ambil lessons-nya
    const result = await Promise.all(
      courseUnits.map(async (unit) => {
        const unitLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.unitId, unit.id))
          .orderBy(asc(lessons.order));

        return {
          ...unit,
          lessons: unitLessons,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
