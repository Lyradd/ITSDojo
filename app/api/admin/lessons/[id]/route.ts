import { NextResponse } from "next/server";
import { db } from "@/db";
import { lessons, testCases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

// PUT /api/admin/lessons/[id] — Update lesson
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);
    const body = await req.json();

    const [updated] = await db
      .update(lessons)
      .set({
        title: body.title,
        order: body.order,
        description: body.description,
        duration: body.duration,
        xpReward: body.xpReward,
        gemReward: body.gemReward,
        videoUrl: body.videoUrl,
        summaryContent: body.summaryContent,
        problemTitle: body.problemTitle,
        problemDescription: body.problemDescription,
        problemCategory: body.problemCategory,
        starterCode: body.starterCode,
        defaultLanguage: body.defaultLanguage,
        sampleInput: body.sampleInput,
        sampleOutput: body.sampleOutput,
      })
      .where(eq(lessons.id, lessonId))
      .returning();

    // Jika test cases dikirimkan, hapus lama & insert baru
    if (body.testCases && Array.isArray(body.testCases)) {
      await db.delete(testCases).where(eq(testCases.lessonId, lessonId));
      if (body.testCases.length > 0) {
        await db.insert(testCases).values(
          body.testCases.map((tc: any, idx: number) => ({
            lessonId: lessonId,
            stdin: tc.stdin || '',
            expected: tc.expected,
            hidden: tc.hidden || false,
            order: idx + 1,
          }))
        );
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/lessons/[id] — Hapus lesson
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);

    // Test cases akan terhapus otomatis karena ON DELETE CASCADE
    await db.delete(lessons).where(eq(lessons.id, lessonId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
