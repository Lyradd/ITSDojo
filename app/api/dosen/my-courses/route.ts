import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses, courseInstructors } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/dosen/my-courses?dosenId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dosenId = searchParams.get("dosenId");

    if (!dosenId) {
      return NextResponse.json({ error: "dosenId is required" }, { status: 400 });
    }

    // Ambil daftar kelas yang diampu dosen ini dengan join tabel
    const myCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageSrc: courses.imageSrc,
        color: courses.color,
        difficulty: courses.difficulty,
        xpReward: courses.xpReward,
      })
      .from(courseInstructors)
      .innerJoin(courses, eq(courseInstructors.courseId, courses.id))
      .where(eq(courseInstructors.dosenId, dosenId));

    return NextResponse.json(myCourses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
