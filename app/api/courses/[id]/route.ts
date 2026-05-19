import { NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

// PUT /api/courses/[id] — Update kelas
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db.update(courses).set({
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      xpReward: body.xpReward,
      color: body.color,
    }).where(eq(courses.id, id)).returning();

    if (!updated) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/courses/[id] — Hapus kelas
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Perhatikan: Menghapus kelas akan gagal jika ada foreign key restrict, 
    // pastikan cascade delete sudah dikonfigurasi di schema jika ingin hapus permanen
    const [deleted] = await db.delete(courses).where(eq(courses.id, id)).returning();

    if (!deleted) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
