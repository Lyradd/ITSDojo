import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, level, xp, profileXp, gems, streak, accuracy, completedLessonIds, gamificationData } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Prepare update payload
    const updateData: any = {};
    if (level !== undefined) updateData.level = level;
    if (xp !== undefined) updateData.xp = xp;
    if (profileXp !== undefined) updateData.profileXp = profileXp;
    if (gems !== undefined) updateData.gems = gems;
    if (streak !== undefined) updateData.streak = streak;
    if (accuracy !== undefined) updateData.accuracy = accuracy;
    if (gamificationData !== undefined) updateData.gamificationData = gamificationData;

    // Execute update if there's anything to update
    if (Object.keys(updateData).length > 0) {
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    }

    // Sync completed lessons if provided
    if (completedLessonIds && Array.isArray(completedLessonIds)) {
      const existing = await db
        .select({ lessonId: userProgress.lessonId })
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
        
      const existingIds = new Set(existing.map(e => e.lessonId.toString()));
      
      const newIds = completedLessonIds
        .filter(id => !existingIds.has(id.toString()) && !isNaN(parseInt(id)))
        .map(id => parseInt(id));
        
      if (newIds.length > 0) {
        await db.insert(userProgress).values(
          newIds.map(lessonId => ({
            userId,
            lessonId
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to sync progress:", error);
    return NextResponse.json({ error: "Failed to sync progress" }, { status: 500 });
  }
}
