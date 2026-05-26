import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lessonDiscussions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);
    
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    const discussions = await db
      .select({
        id: lessonDiscussions.id,
        content: lessonDiscussions.content,
        createdAt: lessonDiscussions.createdAt,
        userId: users.id,
        userName: users.name,
      })
      .from(lessonDiscussions)
      .innerJoin(users, eq(lessonDiscussions.userId, users.id))
      .where(eq(lessonDiscussions.lessonId, lessonId))
      .orderBy(lessonDiscussions.createdAt); // oldest first

    return NextResponse.json(discussions);
  } catch (error: any) {
    console.error("GET /api/lessons/[id]/discussions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);
    
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    // Since auth isn't fully integrated, we'll accept userId and userName from body
    const body = await req.json();
    const { content, userId, userName } = body;

    if (!content || !userId) {
      return NextResponse.json({ error: "Missing content or userId" }, { status: 400 });
    }

    // Mock Auth: Ensure the user exists in the DB so foreign key constraint passes
    let actualUserId = userId;
    try {
      const existingUser = await db.select().from(users).where(eq(users.email, userId)).limit(1);
      
      if (existingUser.length > 0) {
        actualUserId = existingUser[0].id;
      } else {
        await db.insert(users).values({
          id: userId,
          name: userName || "User",
          email: userId,
          role: 'mahasiswa',
          semester: 1,
          level: 1,
          xp: 0,
          streak: 0,
        }).onConflictDoNothing();
      }
    } catch (e) {
      console.error("Failed to ensure user exists", e);
    }

    const newDiscussion = await db.insert(lessonDiscussions).values({
      lessonId,
      userId: actualUserId,
      content,
    }).returning();

    return NextResponse.json(newDiscussion[0]);
  } catch (error: any) {
    console.error("POST /api/lessons/[id]/discussions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
