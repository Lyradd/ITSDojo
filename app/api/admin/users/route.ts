import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

// GET /api/admin/users — Ambil semua user
export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/users — Buat user baru
export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    
    // Generate ID berdasarkan role
    const rolePrefix = body.role || 'mahasiswa';
    const userId = `${rolePrefix}-${Date.now()}`;

    const [newUser] = await db.insert(users).values({
      id: userId,
      name: body.name,
      email: body.email,
      role: body.role || 'mahasiswa',
      semester: body.semester || 1,
    }).returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint (email)
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
