import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, units, lessons } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, asc, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Menggunakan operasi murni SQL LEFT JOIN + COUNT + ARRAY_AGG
    // untuk menghitung seluruh relasi langsung di database (PostgreSQL), 
    // sehingga RAM Node.js sama sekali tidak terbebani oleh in-memory join.
    const rawCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageSrc: courses.imageSrc,
        color: courses.color,
        difficulty: courses.difficulty,
        xpReward: courses.xpReward,
        requiredSemester: courses.requiredSemester,
        unitsCount: sql<number>`count(distinct ${units.id})::int`,
        lessonsCount: sql<number>`count(distinct ${lessons.id})::int`,
        lessonIdsRaw: sql<number[]>`coalesce(array_agg(distinct ${lessons.id}) filter (where ${lessons.id} is not null), array[]::int[])`
      })
      .from(courses)
      .leftJoin(units, eq(courses.id, units.courseId))
      .leftJoin(lessons, eq(units.id, lessons.unitId))
      .groupBy(courses.id)
      .orderBy(asc(courses.id));

    // Menyesuaikan hasil ke dalam format yang diterima frontend
    const enrichedCourses = rawCourses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imageSrc: course.imageSrc,
      color: course.color,
      difficulty: course.difficulty,
      xpReward: course.xpReward,
      requiredSemester: course.requiredSemester,
      unitsCount: course.unitsCount,
      lessonsCount: course.lessonsCount,
      lessonIds: course.lessonIdsRaw.map(String) // Konversi ke array of string untuk konsistensi client
    }));

    return NextResponse.json(enrichedCourses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/courses — Buat kursus baru (admin)
export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const [newCourse] = await db.insert(courses).values({
      id: body.id,
      title: body.title,
      description: body.description,
      imageSrc: body.imageSrc || null,
      color: body.color || 'bg-blue-500',
      difficulty: body.difficulty || 'Beginner',
      xpReward: body.xpReward || 100,
      requiredSemester: body.requiredSemester || 1,
    }).returning();
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
