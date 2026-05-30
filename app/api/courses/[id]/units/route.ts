import { NextResponse } from "next/server";
import { db } from "@/db";
import { units, lessons, testCases } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

// GET /api/courses/[id]/units — Ambil semua unit + lessons untuk sebuah kursus
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    // Menggunakan kapabilitas fitur Drizzle Relational Query 
    // Ini secara otomatis akan mengatasi N+1 Problem dengan melakukan query yang dioptimalkan di balik layar
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      orderBy: [asc(units.order)],
      with: {
        lessons: {
          orderBy: [asc(lessons.order)]
        }
      }
    });

    return NextResponse.json(courseUnits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
