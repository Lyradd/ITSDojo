"use server";

import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { inArray, not, eq, sql } from "drizzle-orm";

export async function getProfileSidebarData(enrolledCourseIds: string[], currentUserId: string) {
  try {
    // 1. Fetch Enrolled Courses
    let enrolledCourses: any[] = [];
    if (enrolledCourseIds && enrolledCourseIds.length > 0) {
      enrolledCourses = await db
        .select()
        .from(courses)
        .where(inArray(courses.id, enrolledCourseIds));
    }

    // 2. Fetch Random Peers (Teman Belajar)
    // Filter users with role 'mahasiswa' who are not the current user
    const peers = await db
      .select({
        id: users.id,
        name: users.name,
        xp: users.xp,
        level: users.level,
        avatar: users.avatar
      })
      .from(users)
      .where(
        not(eq(users.id, currentUserId))
      )
      .orderBy(sql`RANDOM()`)
      .limit(3);

    return { success: true, courses: enrolledCourses, peers };
  } catch (error) {
    console.error("Failed to fetch profile sidebar data:", error);
    return { success: false, courses: [], peers: [] };
  }
}
