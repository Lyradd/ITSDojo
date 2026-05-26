"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { MOCK_STUDENTS } from "@/lib/admin-data";

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

const FIXED_PASSWORD = "123456";

// Validasi login: email harus terdaftar di DB, password harus tepat 123456.
// Return data user (untuk hydrate Zustand) atau null kalau gagal.
export async function validateLogin(email: string, password: string) {
  if (password !== FIXED_PASSWORD) {
    return { success: false, error: "Password salah" };
  }

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
        accuracy: user.accuracy ?? 0,
        streak: user.streak,
        avatar: user.avatar ?? "bg-blue-200 text-blue-700",
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
