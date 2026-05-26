"use server";

import { db } from "@/db";
import { courses } from "@/db/schema";

// Fetch semua kelas dari database. Dipakai di filter dosen, course picker form,
// dan tempat lain yang butuh daftar kelas live (bukan dummy COURSES dari lib/dummydata.ts).
export async function getAllCourses() {
  try {
    return await db.select().from(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return [];
  }
}
