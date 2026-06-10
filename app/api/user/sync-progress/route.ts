import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    // ============================================
    // AUTH GUARD: Verifikasi sesi dari HTTP-only cookie
    // ============================================
    // userId TIDAK diambil dari body request (tidak bisa dipercaya),
    // melainkan dari signed session cookie yang di-set saat login.
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const userId = session.userId; // Sumber kebenaran: dari server-side cookie

    const body = await req.json();
    const { name, avatar, level, xp, profileXp, gems, streak, accuracy, completedLessonIds, gamificationData } = body;

    // Prepare update payload
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
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
        .filter((id: string) => !existingIds.has(id.toString()) && !isNaN(parseInt(id)))
        .map((id: string) => parseInt(id));
        
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
