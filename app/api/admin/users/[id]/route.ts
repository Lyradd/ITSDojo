import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";

// PUT /api/admin/users/[id] — Update user
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, any> = {
      name: body.name,
      email: body.email,
      role: body.role,
      semester: body.semester,
    };

    // Password hanya di-update kalau ada (non-empty) — biar tidak overwrite jadi kosong
    // saat super admin edit profil tanpa ubah password.
    if (typeof body.password === 'string' && body.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(body.password.trim(), 10);
    }

    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

    if (!updated) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Hapus user
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
