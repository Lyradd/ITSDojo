import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, units, lessons } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/courses — Ambil semua kursus
export async function GET() {
  try {
    const allCourses = await db.select().from(courses);
    return NextResponse.json(allCourses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/courses — Buat kursus baru (admin)
export async function POST(req: Request) {
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
