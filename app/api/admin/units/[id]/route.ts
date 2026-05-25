import { NextResponse } from "next/server";
import { db } from "@/db";
import { units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";

// PUT /api/admin/units/[id] — Update unit details
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const unitId = parseInt(id, 10);
    const body = await req.json();

    const [updated] = await db
      .update(units)
      .set({
        title: body.title,
        description: body.description,
        order: body.order,
      })
      .where(eq(units.id, unitId))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/units/[id] — Hapus unit (and cascaded lessons)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const unitId = parseInt(id, 10);

    // Lessons and testCases will delete automatically because of ON DELETE CASCADE in db schema
    await db.delete(units).where(eq(units.id, unitId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
