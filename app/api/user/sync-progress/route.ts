import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, userProgress } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

    // Fetch user role from DB untuk validasi role-based guard
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { role: true }
    });

    const isMahasiswa = existingUser?.role === 'mahasiswa';

    // Prepare update payload
    const updateData: any = {};
    // Semua role boleh update nama dan avatar
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Hanya mahasiswa yang boleh update data gamifikasi
    if (isMahasiswa) {
      if (level !== undefined) updateData.level = level;
      if (xp !== undefined) updateData.xp = xp;
      if (profileXp !== undefined) updateData.profileXp = profileXp;
      if (gems !== undefined) updateData.gems = gems;
      if (streak !== undefined) updateData.streak = streak;
      if (accuracy !== undefined) updateData.accuracy = accuracy;
      if (gamificationData !== undefined) updateData.gamificationData = gamificationData;
    }

    // Execute update if there's anything to update
    if (Object.keys(updateData).length > 0) {
      const clientLastUpdated = gamificationData?.lastUpdated || 0;

      // Only apply OCC if we are actually updating gamificationData
      const condition = gamificationData !== undefined && clientLastUpdated > 0
        ? and(
            eq(users.id, userId),
            sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) <= ${clientLastUpdated}`
          )
        : eq(users.id, userId);

      const result = await db.update(users)
        .set(updateData)
        .where(condition)
        .returning({ id: users.id });

      if (result.length === 0) {
         // Race condition: Server has newer data than the client payload!
         return NextResponse.json({ success: false, error: "Stale data, sync rejected.", requireSync: true }, { status: 409 });
      }
    }
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
