import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, units, lessons } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const allCourses = await db.select().from(courses);
    const allUnits = await db.select().from(units);
    const allLessons = await db.select().from(lessons);

    const enrichedCourses = allCourses.map(course => {
      const courseUnits = allUnits.filter(u => u.courseId === course.id);
      const unitIds = courseUnits.map(u => u.id);
      const courseLessons = allLessons.filter(l => unitIds.includes(l.unitId));
      
      return {
        ...course,
        unitsCount: courseUnits.length,
        lessonsCount: courseLessons.length
      };
    });

    return NextResponse.json(enrichedCourses);
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
