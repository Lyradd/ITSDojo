import { NextResponse } from "next/server";
import { db } from "@/db";
import { lessons, testCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

// POST /api/admin/lessons — Buat lesson baru (beserta test cases)
export async function POST(req: Request) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();

    // Insert lesson
    const [newLesson] = await db.insert(lessons).values({
      unitId: body.unitId,
      title: body.title,
      order: body.order,
      description: body.description || null,
      duration: body.duration || null,
      xpReward: body.xpReward || 50,
      gemReward: body.gemReward || 10,
      videoUrl: body.videoUrl || null,
      summaryContent: body.summaryContent || null,
      problemTitle: body.problemTitle || null,
      problemDescription: body.problemDescription || null,
      problemCategory: body.problemCategory || null,
      starterCode: body.starterCode || null,
      defaultLanguage: body.defaultLanguage || 'c',
      sampleInput: body.sampleInput || null,
      sampleOutput: body.sampleOutput || null,
    }).returning();

    // Insert test cases jika ada
    if (body.testCases && Array.isArray(body.testCases) && body.testCases.length > 0) {
      await db.insert(testCases).values(
        body.testCases.map((tc: any, idx: number) => ({
          lessonId: newLesson.id,
          stdin: tc.stdin || '',
          expected: tc.expected,
          hidden: tc.hidden || false,
          order: idx + 1,
        }))
      );
    }

    return NextResponse.json(newLesson, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
