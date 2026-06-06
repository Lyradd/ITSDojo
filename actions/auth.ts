"use server";

import { db } from "@/db";
import { users, enrollments, userProgress } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { MOCK_STUDENTS } from "@/lib/admin-data";
import { createSession, destroySession } from "@/lib/session";
import bcrypt from "bcryptjs";

const VALID_ROLES = new Set(["mahasiswa", "asdos", "dosen", "admin"]);

// Seed semua MOCK_STUDENTS ke tabel users (idempotent — skip user yang sudah ada).
// Dipakai sekali saat first-time setup atau saat butuh refresh test data.
export async function seedMockUsers() {
  try {
    let inserted = 0;
    let skipped = 0;

    for (const s of MOCK_STUDENTS) {
      const role = VALID_ROLES.has(s.role || "") ? (s.role as any) : "mahasiswa";

      // Cek apakah user sudah ada (by email)
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, s.email)).limit(1);
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(users).values({
        id: s.id,
        name: s.name,
        email: s.email,
        password: await bcrypt.hash("123456", 10),
        role,
        semester: s.semester ?? 1,
        level: s.level ?? 1,
        xp: s.xp ?? 0,
        accuracy: s.accuracy ?? 0,
        streak: s.streak ?? 0,
        avatar: s.avatar || "bg-blue-200 text-blue-700",
      });
      inserted++;
    }

    return { success: true, inserted, skipped, total: MOCK_STUDENTS.length };
  } catch (error) {
    console.error("Failed to seed users:", error);
    return { success: false, error: "Database error" };
  }
}

// ============================================
// LOGIN VALIDATION
// ============================================

// Validasi login: email harus terdaftar di DB, password harus match dengan users.password.
// Default password awal "123456" (di-set saat seed). Super admin bisa ubah via /admin/users.
export async function validateLogin(email: string, password: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Email tidak terdaftar" };
    }

    const user = result[0];

    // Compare password — menggunakan bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Fallback untuk migrasi password plain text lama ("123456")
      if (user.password === password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));
      } else {
        return { success: false, error: "Password salah" };
      }
    }

    // Fetch course IDs yang user sudah accepted di tabel enrollments
    const enrolledRows = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, user.id),
          eq(enrollments.status, 'accepted'),
        ),
      );
    const enrolledCourseIds = enrolledRows.map((r) => r.courseId);

    // Fetch completed lesson IDs
    const progressRows = await db
      .select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(eq(userProgress.userId, user.id));
    const completedLessonIds = progressRows.map((r) => r.lessonId.toString());

    // Set HTTP-only signed session cookie
    await createSession({ userId: user.id, role: user.role });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        level: user.level,
        xp: user.xp,
        profileXp: user.profileXp,
        gems: user.gems,
        accuracy: user.accuracy ?? 0,
        streak: user.streak,
        avatar: user.avatar ?? "bg-blue-200 text-blue-700",
        enrolledCourseIds,
        completedLessonIds,
        gamificationData: user.gamificationData,
      },
    };
  } catch (error) {
    console.error("Failed to validate login:", error);
    return { success: false, error: "Server error" };
  }
}

// Untuk dropdown selector di login page — list semua user yang bisa dipakai
// untuk login cepat selama development/demo.
export async function getLoginOptions() {
  try {
    const all = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .orderBy(users.role, users.name);
    return all;
  } catch (error) {
    console.error("Failed to fetch login options:", error);
    return [];
  }
}

// Mengambil profil pengguna terbaru dari database
export async function getUserProfile(userId: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "User not found" };
    }

    const user = result[0];
    
    // Fetch course IDs yang user sudah accepted di tabel enrollments
    const enrolledRows = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, user.id),
          eq(enrollments.status, 'accepted'),
        ),
      );
    const enrolledCourseIds = enrolledRows.map((r) => r.courseId);

    // Fetch completed lesson IDs
    const progressRows = await db
      .select({ lessonId: userProgress.lessonId })
      .from(userProgress)
      .where(eq(userProgress.userId, user.id));
    const completedLessonIds = progressRows.map((r) => r.lessonId.toString());

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        level: user.level,
        xp: user.xp,
        profileXp: user.profileXp,
        gems: user.gems,
        accuracy: user.accuracy ?? 0,
        streak: user.streak,
        avatar: user.avatar ?? "bg-blue-200 text-blue-700",
        enrolledCourseIds,
        completedLessonIds,
        gamificationData: user.gamificationData,
      },
    };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return { success: false, error: "Server error" };
  }
}

// ============================================
// LOGOUT — Destroy server-side session
// ============================================
export async function logoutSession() {
  await destroySession();
  return { success: true };
}

// ============================================
// BYPASS ADMIN — For Dev/Demo Only
// ============================================
export async function bypassLoginAsAdmin() {
  await createSession({ userId: "super-admin-bypass", role: "admin" });
  return { success: true };
}
