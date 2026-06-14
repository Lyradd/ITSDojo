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
    // HANYA ambil data profil & preferensi (Competitive stats diabaikan sepenuhnya)
    const { name, avatar, gamificationData } = body;
    // Client mengirim bio, bookmarkedCourseIds, courseAccessHistory DI DALAM gamificationData
    const bio = gamificationData?.bio;
    const bookmarkedCourseIds = gamificationData?.bookmarkedCourseIds;
    const courseAccessHistory = gamificationData?.courseAccessHistory;

    let retries = 3;
    let success = false;

    while (retries > 0) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true, gamificationData: true }
      });

      if (!existingUser) break;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (avatar !== undefined) updateData.avatar = avatar;

      let hasGamificationUpdate = false;
      const gData: any = existingUser.gamificationData || {};
      const currentLastUpdated = gData.lastUpdated || 0;

      if (bio !== undefined && gData.bio !== bio) { gData.bio = bio; hasGamificationUpdate = true; }
      if (bookmarkedCourseIds !== undefined) { gData.bookmarkedCourseIds = bookmarkedCourseIds; hasGamificationUpdate = true; }
      if (courseAccessHistory !== undefined) { gData.courseAccessHistory = courseAccessHistory; hasGamificationUpdate = true; }
      
      // Safe Merge for Daily Goals (Prevent Hackers from injecting fake rewards)
      if (gamificationData?.dailyGoals && Array.isArray(gamificationData.dailyGoals)) {
         const clientGoals = gamificationData.dailyGoals;
         const serverGoals = gData.dailyGoals || [];
         let changed = false;
         serverGoals.forEach((sg: any) => {
            const cg = clientGoals.find((g: any) => g.id === sg.id);
            if (cg && !sg.isClaimed) {
               // Only allow progress to go up
               if (cg.currentProgress > sg.currentProgress) {
                  sg.currentProgress = Math.min(cg.currentProgress, sg.targetValue);
                  sg.isCompleted = sg.currentProgress >= sg.targetValue;
                  changed = true;
               }
            }
         });
         if (changed) hasGamificationUpdate = true;
      }


      if (hasGamificationUpdate) {
        gData.lastUpdated = Date.now();
        updateData.gamificationData = gData;
      }

      if (Object.keys(updateData).length > 0) {
        let condition = eq(users.id, userId);
        
        // Gunakan OCC jika kita memodifikasi gamificationData
        if (hasGamificationUpdate) {
          const occCondition = currentLastUpdated > 0
            ? sql`COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = ${currentLastUpdated}`
            : sql`${users.gamificationData}->>'lastUpdated' IS NULL OR COALESCE((${users.gamificationData}->>'lastUpdated')::bigint, 0) = 0`;
          condition = and(eq(users.id, userId), occCondition) as any;
        }

        const result = await db.update(users)
          .set(updateData)
          .where(condition)
          .returning({ id: users.id });

        if (result.length > 0) {
          success = true;
          break;
        }
        
        // Jitter / Exponential Backoff untuk mencegah Timeout dan DB Spam
        retries--;
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
      } else {
        // Tidak ada yang perlu diupdate
        success = true;
        break;
      }
    }

    if (!success) {
      return NextResponse.json({ success: false, error: "Stale data or OCC conflict, sync rejected.", requireSync: true }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to sync progress:", error);
    return NextResponse.json({ error: "Failed to sync progress" }, { status: 500 });
  }
}
